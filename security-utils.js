// Security Utilities for Uninest Application
// This file contains functions to prevent XSS, SQL injection, and other security vulnerabilities
// calculator, feedback, kuppi overview, kuppi details, progress dashboard, reqkuppii , subject progress pages are secured with this

/**
 * Sanitize HTML content to prevent XSS attacks
 * @param {string} str - The string to sanitize
 * @returns {string} - Sanitized string safe for DOM insertion
 */
function sanitizeHTML(str) {
  if (typeof str !== 'string') return '';
  
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/**
 * Escape HTML entities to prevent XSS
 * @param {string} str - The string to escape
 * @returns {string} - Escaped string
 */
function escapeHTML(str) {
  if (typeof str !== 'string') return '';
  
  const htmlEscapes = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;'
  };
  
  return str.replace(/[&<>"'/]/g, function(match) {
    return htmlEscapes[match];
  });
}

/**
 * Validate and sanitize user input for text fields
 * @param {string} input - User input to validate
 * @param {number} maxLength - Maximum allowed length
 * @param {boolean} allowHTML - Whether to allow HTML tags (default: false)
 * @returns {string} - Sanitized input or empty string if invalid
 */
function validateAndSanitizeInput(input, maxLength = 1000, allowHTML = false) {
  if (typeof input !== 'string') return '';
  
  // Trim whitespace
  input = input.trim();
  
  // Check length
  if (input.length > maxLength) {
    input = input.substring(0, maxLength);
  }
  
  // Remove null bytes and control characters
  input = input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  
  // Sanitize based on allowHTML flag
  if (allowHTML) {
    // Allow only safe HTML tags
    const allowedTags = ['b', 'i', 'em', 'strong', 'u', 'br', 'p'];
    const allowedAttributes = ['class'];
    
    // Remove all script tags and event handlers
    input = input.replace(/<script[^>]*>.*?<\/script>/gi, '');
    input = input.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
    input = input.replace(/javascript:/gi, '');
    
    // Only allow specific tags
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = input;
    
    // Remove disallowed tags
    const allTags = tempDiv.querySelectorAll('*');
    allTags.forEach(tag => {
      if (!allowedTags.includes(tag.tagName.toLowerCase())) {
        const parent = tag.parentNode;
        if (parent) {
          parent.replaceChild(document.createTextNode(tag.textContent), tag);
        }
      } else {
        // Remove disallowed attributes
        const attributes = Array.from(tag.attributes);
        attributes.forEach(attr => {
          if (!allowedAttributes.includes(attr.name.toLowerCase())) {
            tag.removeAttribute(attr.name);
          }
        });
      }
    });
    
    return tempDiv.innerHTML;
  } else {
    // No HTML allowed - escape everything
    return escapeHTML(input);
  }
}

/**
 * Validate file upload
 * @param {File} file - File object to validate
 * @param {Array} allowedTypes - Array of allowed MIME types
 * @param {number} maxSize - Maximum file size in bytes
 * @returns {Object} - Validation result with success and message
 */
function validateFileUpload(file, allowedTypes = [], maxSize = 10 * 1024 * 1024) {
  if (!file) {
    return { success: false, message: 'No file selected' };
  }
  
  // Check file size
  if (file.size > maxSize) {
    return { 
      success: false, 
      message: `File size exceeds maximum allowed size of ${Math.round(maxSize / 1024 / 1024)}MB` 
    };
  }
  
  // Check file type
  if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
    return { 
      success: false, 
      message: `File type not allowed. Allowed types: ${allowedTypes.join(', ')}` 
    };
  }
  
  // Check file extension
  const fileName = file.name.toLowerCase();
  const allowedExtensions = ['.pdf', '.doc', '.docx', '.ppt', '.pptx', '.txt'];
  const hasValidExtension = allowedExtensions.some(ext => fileName.endsWith(ext));
  
  if (!hasValidExtension) {
    return { 
      success: false, 
      message: 'File extension not allowed' 
    };
  }
  
  return { success: true, message: 'File validation passed' };
}

/**
 * Secure DOM insertion using textContent instead of innerHTML
 * @param {HTMLElement} element - Target element
 * @param {string} content - Content to insert
 * @param {boolean} allowHTML - Whether to allow HTML (default: false)
 */
function secureSetContent(element, content, allowHTML = false) {
  if (!element) return;
  
  const sanitizedContent = validateAndSanitizeInput(content, 10000, allowHTML);
  
  if (allowHTML) {
    element.innerHTML = sanitizedContent;
  } else {
    element.textContent = sanitizedContent;
  }
}

/**
 * Create secure HTML elements with sanitized content
 * @param {string} tagName - HTML tag name
 * @param {Object} attributes - Object of attributes
 * @param {string} content - Element content
 * @returns {HTMLElement} - Created element
 */
function createSecureElement(tagName, attributes = {}, content = '') {
  const element = document.createElement(tagName);
  
  // Set attributes safely
  Object.keys(attributes).forEach(key => {
    if (key === 'innerHTML' || key === 'textContent') {
      secureSetContent(element, attributes[key], key === 'innerHTML');
    } else {
      element.setAttribute(key, escapeHTML(attributes[key]));
    }
  });
  
  // Set content if provided
  if (content) {
    secureSetContent(element, content);
  }
  
  return element;
}

/**
 * Validate search input
 * @param {string} searchTerm - Search term to validate
 * @returns {string} - Sanitized search term
 */
function validateSearchInput(searchTerm) {
  return validateAndSanitizeInput(searchTerm, 100, false);
}

/**
 * Validate comment input
 * @param {string} comment - Comment text to validate
 * @returns {string} - Sanitized comment
 */
function validateCommentInput(comment) {
  return validateAndSanitizeInput(comment, 2000, false);
}

/**
 * Validate form input
 * @param {string} input - Form input to validate
 * @param {string} type - Input type (text, email, number, etc.)
 * @returns {string} - Sanitized input
 */
function validateFormInput(input, type = 'text') {
  switch (type) {
    case 'email':
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(input) ? validateAndSanitizeInput(input, 254, false) : '';
    case 'number':
      return isNaN(input) ? '' : input.toString();
    case 'url':
      try {
        new URL(input);
        return validateAndSanitizeInput(input, 2048, false);
      } catch {
        return '';
      }
    default:
      return validateAndSanitizeInput(input, 1000, false);
  }
}

/**
 * Prevent common injection attacks in URLs
 * @param {string} url - URL to validate
 * @returns {string} - Sanitized URL or empty string if invalid
 */
function validateURL(url) {
  if (typeof url !== 'string') return '';
  
  // Remove any script tags or javascript: protocols
  url = url.replace(/<script[^>]*>.*?<\/script>/gi, '');
  url = url.replace(/javascript:/gi, '');
  url = url.replace(/data:/gi, '');
  
  // Basic URL validation
  try {
    const urlObj = new URL(url);
    return urlObj.href;
  } catch {
    return '';
  }
}

// Export functions for use in other files
window.SecurityUtils = {
  sanitizeHTML,
  escapeHTML,
  validateAndSanitizeInput,
  validateFileUpload,
  secureSetContent,
  createSecureElement,
  validateSearchInput,
  validateCommentInput,
  validateFormInput,
  validateURL
};
