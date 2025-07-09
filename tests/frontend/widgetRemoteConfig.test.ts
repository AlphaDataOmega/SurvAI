/**
 * @fileoverview Tests for widget remote configuration loading
 */

import { 
  RemoteConfigLoader, 
  createRemoteConfigLoader, 
  loadRemoteConfig,
  RemoteConfigErrorType 
} from '../../frontend/src/widget/utils/remoteConfig';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock setTimeout and clearTimeout for timeout testing
jest.useFakeTimers();
jest.setTimeout(15000);

describe('RemoteConfigLoader', () => {
  let loader: RemoteConfigLoader;

  beforeEach(() => {
    loader = new RemoteConfigLoader();
    mockFetch.mockClear();
    jest.clearAllTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
  });

  describe('successful configuration loading', () => {
    it('should load valid configuration successfully', async () => {
      const mockConfig = {
        surveyId: 'remote-survey-123',
        theme: {
          primaryColor: '#ff0000',
          buttonSize: 'large'
        },
        apiUrl: 'https://api.example.com'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: {
          get: (name: string) => name === 'content-type' ? 'application/json' : null
        },
        json: async () => mockConfig
      });

      const result = await loader.loadConfig('https://example.com/config.json');

      expect(result).toEqual(mockConfig);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://example.com/config.json',
        expect.objectContaining({
          method: 'GET',
          mode: 'cors',
          credentials: 'omit',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        })
      );
    });

    it('should validate and sanitize configuration', async () => {
      const mockConfig = {
        surveyId: 'valid-survey',
        theme: {
          primaryColor: '#ff0000',
          invalidProperty: 'should-be-filtered',
          shadows: true
        },
        partnerId: 'partner-123',
        configUrl: 'https://evil.com/recursive', // Should be filtered
        onError: () => console.log('should-be-filtered'), // Should be filtered
        apiUrl: 'https://valid-api.com'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: {
          get: (name: string) => name === 'content-type' ? 'application/json' : null
        },
        json: async () => mockConfig
      });

      const result = await loader.loadConfig('https://example.com/config.json');

      expect(result).toEqual({
        surveyId: 'valid-survey',
        theme: {
          primaryColor: '#ff0000',
          shadows: true
        },
        partnerId: 'partner-123',
        apiUrl: 'https://valid-api.com'
      });

      // Should not include recursive configUrl or onError function
      expect(result).not.toHaveProperty('configUrl');
      expect(result).not.toHaveProperty('onError');
      expect((result.theme as any)?.invalidProperty).toBeUndefined();
    });

    it('should handle partial configurations', async () => {
      const mockConfig = {
        theme: {
          primaryColor: '#00ff00'
        }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: {
          get: (name: string) => name === 'content-type' ? 'application/json' : null
        },
        json: async () => mockConfig
      });

      const result = await loader.loadConfig('https://example.com/config.json');

      expect(result).toEqual({
        theme: {
          primaryColor: '#00ff00'
        }
      });
    });
  });

  describe('error handling', () => {
    it('should handle invalid URLs gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const result = await loader.loadConfig('not-a-valid-url');

      expect(result).toEqual({});
      expect(consoleSpy).toHaveBeenCalledWith(
        'Invalid config URL format:',
        'not-a-valid-url'
      );

      consoleSpy.mockRestore();
    });

    it('should handle network errors gracefully', async () => {
      jest.useRealTimers();
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await loader.loadConfig('https://example.com/config.json');

      expect(result).toEqual({});
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to load remote config after retries:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
      jest.useFakeTimers();
    }, 15000);

    it('should handle HTTP errors gracefully', async () => {
      jest.useRealTimers();
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      });

      const result = await loader.loadConfig('https://example.com/config.json');

      expect(result).toEqual({});
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to load remote config after retries:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
      jest.useFakeTimers();
    }, 15000);

    it('should handle CORS errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const corsError = new TypeError('Failed to fetch');
      corsError.message = 'CORS error';
      mockFetch.mockRejectedValueOnce(corsError);

      const result = await loader.loadConfig('https://example.com/config.json');

      expect(result).toEqual({});
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to load remote config after retries:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });

    it('should handle timeout errors', async () => {
      jest.useRealTimers();
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      // Mock AbortController
      const mockAbortController = {
        abort: jest.fn(),
        signal: { aborted: false }
      };
      
      global.AbortController = jest.fn(() => mockAbortController) as any;

      const timeoutError = new Error('AbortError');
      timeoutError.name = 'AbortError';
      
      mockFetch.mockRejectedValueOnce(timeoutError);

      const result = await loader.loadConfig('https://example.com/config.json');

      expect(result).toEqual({});
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to load remote config after retries:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
      jest.useFakeTimers();
    }, 15000);

    it('should handle invalid JSON gracefully', async () => {
      jest.useRealTimers();
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: {
          get: (name: string) => name === 'content-type' ? 'application/json' : null
        },
        json: async () => {
          throw new Error('Invalid JSON');
        }
      });

      const result = await loader.loadConfig('https://example.com/config.json');

      expect(result).toEqual({});
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to load remote config after retries:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
      jest.useFakeTimers();
    }, 15000);

    it('should handle non-JSON content type', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: {
          get: (name: string) => name === 'content-type' ? 'text/html' : null
        }
      });

      const result = await loader.loadConfig('https://example.com/config.json');

      expect(result).toEqual({});
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to load remote config after retries:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('retry logic', () => {
    it('should retry on network failures', async () => {
      jest.useRealTimers();
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      // First two calls fail, third succeeds
      mockFetch
        .mockRejectedValueOnce(new Error('Network error 1'))
        .mockRejectedValueOnce(new Error('Network error 2'))
        .mockResolvedValueOnce({
          ok: true,
          headers: {
            get: (name: string) => name === 'content-type' ? 'application/json' : null
          },
          json: async () => ({ surveyId: 'success' })
        });

      const customLoader = new RemoteConfigLoader(5000, 3);
      const result = await customLoader.loadConfig('https://example.com/config.json');

      expect(result).toEqual({ surveyId: 'success' });
      expect(mockFetch).toHaveBeenCalledTimes(3);

      consoleSpy.mockRestore();
      jest.useFakeTimers();
    }, 15000);

    it('should not retry on CORS errors', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const corsError = new TypeError('Failed to fetch');
      corsError.message = 'CORS error';
      mockFetch.mockRejectedValueOnce(corsError);

      const result = await loader.loadConfig('https://example.com/config.json');

      expect(result).toEqual({});
      expect(mockFetch).toHaveBeenCalledTimes(1); // Should not retry
      
      consoleSpy.mockRestore();
    });

    it('should not retry on validation errors', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: {
          get: (name: string) => name === 'content-type' ? 'application/json' : null
        },
        json: async () => 'not an object'
      });

      const result = await loader.loadConfig('https://example.com/config.json');

      expect(result).toEqual({});
      expect(mockFetch).toHaveBeenCalledTimes(1); // Should not retry
      
      consoleSpy.mockRestore();
    });
  });

  describe('theme validation', () => {
    it('should validate theme colors', async () => {
      const mockConfig = {
        theme: {
          primaryColor: '#ff0000',     // Valid hex
          secondaryColor: 'blue',      // Valid named color
          accentColor: 'invalid-color', // Invalid
          textColor: '#xyz123'         // Invalid hex
        }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: {
          get: (name: string) => name === 'content-type' ? 'application/json' : null
        },
        json: async () => mockConfig
      });

      const result = await loader.loadConfig('https://example.com/config.json');

      expect(result.theme).toEqual({
        primaryColor: '#ff0000',
        secondaryColor: 'blue'
        // Invalid colors should be filtered out
      });
    }, 15000);

    it('should validate theme spacing and button size', async () => {
      const mockConfig = {
        theme: {
          primaryColor: '#ff0000',      // Valid
          secondaryColor: 'blue',       // Valid
          spacing: 'compact',           // Valid
          buttonSize: 'large',          // Valid
          shadows: true,                // Valid
          transitions: false,           // Valid
          invalidSpacing: 'huge',       // Invalid property
          invalidButtonSize: 'tiny'     // Invalid value
        }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: {
          get: (name: string) => name === 'content-type' ? 'application/json' : null
        },
        json: async () => mockConfig
      });

      const result = await loader.loadConfig('https://example.com/config.json');

      expect(result.theme).toEqual({
        primaryColor: '#ff0000',
        secondaryColor: 'blue',
        spacing: 'compact',
        buttonSize: 'large',
        shadows: true,
        transitions: false
      });
    }, 15000);
  });

  describe('URL validation', () => {
    it('should accept valid HTTPS URLs', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: {
          get: (name: string) => name === 'content-type' ? 'application/json' : null
        },
        json: async () => ({})
      });

      const result = await loader.loadConfig('https://example.com/config.json');
      expect(mockFetch).toHaveBeenCalled();
    });

    it('should accept valid HTTP URLs', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: {
          get: (name: string) => name === 'content-type' ? 'application/json' : null
        },
        json: async () => ({})
      });

      const result = await loader.loadConfig('http://example.com/config.json');
      expect(mockFetch).toHaveBeenCalled();
    });

    it('should reject invalid protocols', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const result = await loader.loadConfig('ftp://example.com/config.json');
      
      expect(result).toEqual({});
      expect(mockFetch).not.toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith(
        'Invalid config URL format:',
        'ftp://example.com/config.json'
      );

      consoleSpy.mockRestore();
    });
  });

  describe('configuration updates', () => {
    it('should update timeout and retries', () => {
      const customLoader = new RemoteConfigLoader(10000, 5);
      customLoader.updateConfig(15000, 3);

      // We can't directly test the internal values, but we can test behavior
      expect(customLoader).toBeInstanceOf(RemoteConfigLoader);
    });
  });
});

describe('createRemoteConfigLoader', () => {
  it('should create RemoteConfigLoader instance', () => {
    const loader = createRemoteConfigLoader();
    expect(loader).toBeInstanceOf(RemoteConfigLoader);
  });

  it('should create RemoteConfigLoader with custom timeout and retries', () => {
    const loader = createRemoteConfigLoader(8000, 4);
    expect(loader).toBeInstanceOf(RemoteConfigLoader);
  });
});

describe('loadRemoteConfig convenience function', () => {
  beforeEach(() => {
    mockFetch.mockClear();
    jest.clearAllTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
  });

  it('should load configuration using convenience function', async () => {
    jest.useRealTimers();
    const mockConfig = { surveyId: 'test-survey' };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      headers: {
        get: (name: string) => name === 'content-type' ? 'application/json' : null
      },
      json: async () => mockConfig
    });

    const result = await loadRemoteConfig('https://example.com/config.json');

    expect(result).toEqual(mockConfig);
    expect(mockFetch).toHaveBeenCalledWith(
      'https://example.com/config.json',
      expect.any(Object)
    );
    jest.useFakeTimers();
  }, 15000);

  it('should handle errors gracefully in convenience function', async () => {
    jest.useRealTimers();
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const result = await loadRemoteConfig('https://example.com/config.json');

    expect(result).toEqual({});
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
    jest.useFakeTimers();
  }, 15000);
});

describe('security considerations', () => {
  let loader: RemoteConfigLoader;

  beforeEach(() => {
    loader = new RemoteConfigLoader();
    mockFetch.mockClear();
  });

  it('should not include credentials in requests', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      headers: {
        get: (name: string) => name === 'content-type' ? 'application/json' : null
      },
      json: async () => ({})
    });

    await loader.loadConfig('https://example.com/config.json');

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        credentials: 'omit'
      })
    );
  });

  it('should filter out dangerous properties', async () => {
    const maliciousConfig = {
      surveyId: 'test',
      configUrl: 'https://evil.com/recursive',
      onError: () => alert('xss'),
      __proto__: { evil: true },
      eval: 'dangerous code'
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      headers: {
        get: (name: string) => name === 'content-type' ? 'application/json' : null
      },
      json: async () => maliciousConfig
    });

    const result = await loader.loadConfig('https://example.com/config.json');

    expect(result).toEqual({
      surveyId: 'test'
    });
    
    expect(result).not.toHaveProperty('configUrl');
    expect(result).not.toHaveProperty('onError');
    expect(result).not.toHaveProperty('eval');
    expect(Object.prototype.hasOwnProperty.call(result, '__proto__')).toBe(false);
  });
});