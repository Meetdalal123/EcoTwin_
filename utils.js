/**
 * EcoTwin Utilities (utils.js)
 * ============================
 * Shared utility functions to enforce security, input hygiene,
 * integrity checks, HTML sanitization, and performance optimization.
 */

const EcoUtils = {
  /**
   * Escapes HTML special characters to prevent XSS injections.
   * @param {string} str
   * @returns {string}
   */
  escapeHTML(str) {
    if (typeof str !== 'string') return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  },

  /**
   * Sanitizes numeric input to ensure it falls within a valid range.
   * @param {any} val
   * @param {number} min
   * @param {number} max
   * @param {number} fallback
   * @returns {number}
   */
  sanitizeNumeric(val, min = 0, max = 1000000, fallback = 0) {
    const num = parseFloat(val);
    if (isNaN(num)) return fallback;
    return Math.min(max, Math.max(min, num));
  },

  /**
   * Debounces a function execution to limit execution rate.
   * @param {Function} func
   * @param {number} wait
   * @returns {Function}
   */
  debounce(func, wait = 150) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  /**
   * Sanitizes HTML content using DOMPurify. Falls back gracefully if DOMPurify is not loaded.
   * @param {string} html
   * @returns {string}
   */
  sanitizeHTML(html) {
    if (typeof DOMPurify !== 'undefined') {
      return DOMPurify.sanitize(html);
    }
    return html;
  },

  /**
   * Secure localStorage wrapper with signature-based integrity checks and data expiration.
   */
  storage: {
    SALT: 'eco-twin-integrity-salt-2026',

    /**
     * Cyr53-based lightweight hash function for data signing
     */
    hash(str) {
      let h1 = 0xdeadbeef,
        h2 = 0x41c6ce57;
      for (let i = 0, ch; i < str.length; i++) {
        ch = str.charCodeAt(i);
        h1 = Math.imul(h1 ^ ch, 2654435761);
        h2 = Math.imul(h2 ^ ch, 1597334677);
      }
      h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
      h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
      return (h2 >>> 0).toString(16).padStart(8, '0') + (h1 >>> 0).toString(16).padStart(8, '0');
    },

    setItem(key, value, expiryDays = 30) {
      const data = {
        value: value,
        expireAt: Date.now() + expiryDays * 24 * 60 * 60 * 1000,
      };
      const serialized = JSON.stringify(data);
      const signature = this.hash(serialized + this.SALT);
      const envelope = {
        payload: serialized,
        signature: signature,
      };
      localStorage.setItem(key, JSON.stringify(envelope));
    },

    getItem(key) {
      const envelopeStr = localStorage.getItem(key);
      if (!envelopeStr) return null;
      try {
        const envelope = JSON.parse(envelopeStr);
        if (!envelope || !envelope.payload || !envelope.signature) {
          // Fallback: If it's old legacy plain JSON or raw string
          try {
            return JSON.parse(envelopeStr);
          } catch (e) {
            return envelopeStr;
          }
        }

        // Verify cryptographic signature to detect tampering
        const expectedSignature = this.hash(envelope.payload + this.SALT);
        if (envelope.signature !== expectedSignature) {
          console.warn(
            `[Storage] Integrity check failed for key: ${key}. Data tampered or corrupted.`
          );
          localStorage.removeItem(key);
          return null;
        }

        const data = JSON.parse(envelope.payload);
        // Check expiration
        if (data.expireAt && Date.now() > data.expireAt) {
          console.log(`[Storage] Key has expired: ${key}`);
          localStorage.removeItem(key);
          return null;
        }
        return data.value;
      } catch (e) {
        // Fallback for raw strings
        try {
          return JSON.parse(envelopeStr);
        } catch (ex) {
          return envelopeStr;
        }
      }
    },

    removeItem(key) {
      localStorage.removeItem(key);
    },
  },
};

const Utils = EcoUtils;

window.EcoUtils = EcoUtils;
window.Utils = Utils;

if (typeof module !== 'undefined' && module.exports) {
  module.exports = EcoUtils;
  global.EcoUtils = EcoUtils;
  global.Utils = Utils;
}
