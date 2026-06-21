/**
 * backend/verify-jwt.js
 * ---------------------
 * A lightweight Cloudflare Worker script using Web Crypto APIs to verify
 * Google JWT signature payloads securely.
 */

export default {
  async fetch(request, env, ctx) {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        }
      });
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    try {
      const { credential } = await request.json();
      if (!credential) {
        return new Response(JSON.stringify({ error: 'Missing credential' }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }
      
      const parts = credential.split('.');
      if (parts.length !== 3) {
        return new Response(JSON.stringify({ error: 'Invalid JWT structure' }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }

      // Helper function to decode base64url
      const base64UrlDecode = (str) => {
        let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
        while (base64.length % 4) {
          base64 += '=';
        }
        return atob(base64);
      };

      // 1. Decode header and payload
      let header, payload;
      try {
        header = JSON.parse(base64UrlDecode(parts[0]));
        payload = JSON.parse(base64UrlDecode(parts[1]));
      } catch (err) {
        return new Response(JSON.stringify({ error: 'Failed to parse token payload' }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }

      // 2. Verify issuer and expiration
      if (payload.iss !== 'https://accounts.google.com' && payload.iss !== 'accounts.google.com') {
        return new Response(JSON.stringify({ error: 'Invalid issuer' }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }

      if (payload.exp * 1000 < Date.now()) {
        return new Response(JSON.stringify({ error: 'Token expired' }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }

      // 3. Fetch Google's public JWKs
      const certsResponse = await fetch('https://www.googleapis.com/oauth2/v3/certs');
      if (!certsResponse.ok) {
        return new Response(JSON.stringify({ error: 'Failed to fetch Google public keys' }), {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }
      
      const { keys } = await certsResponse.json();
      const jwk = keys.find(k => k.kid === header.kid);
      if (!jwk) {
        return new Response(JSON.stringify({ error: 'JWK kid not found' }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }

      // 4. Import the key using Web Crypto SubtleCrypto
      const key = await crypto.subtle.importKey(
        'jwk',
        jwk,
        { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
        false,
        ['verify']
      );

      // 5. Verify the signature
      const encoder = new TextEncoder();
      const signatureInputBytes = encoder.encode(parts[0] + '.' + parts[1]);
      
      const signatureBinary = base64UrlDecode(parts[2]);
      const signatureBytes = new Uint8Array(signatureBinary.length);
      for (let i = 0; i < signatureBinary.length; i++) {
        signatureBytes[i] = signatureBinary.charCodeAt(i);
      }
      
      const isValid = await crypto.subtle.verify(
        'RSASSA-PKCS1-v1_5',
        key,
        signatureBytes,
        signatureInputBytes
      );

      if (!isValid) {
        return new Response(JSON.stringify({ error: 'Signature verification failed' }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }

      return new Response(JSON.stringify({ success: true, payload }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    } catch (e) {
      return new Response(JSON.stringify({ error: e.message }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
  }
};
