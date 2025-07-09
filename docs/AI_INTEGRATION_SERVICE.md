# AI Integration Service Documentation

## Overview

The AI Integration Service provides a unified interface for generating survey questions using multiple AI providers (OpenAI and Ollama) with automatic fallback logic. This service is designed specifically for financial assistance survey content generation with built-in security, performance tracking, and error handling.

## Architecture

### Core Components

- **AIService**: Main service class that manages multiple AI providers
- **Provider Management**: Handles OpenAI and Ollama client initialization and configuration
- **Fallback Logic**: Automatic provider switching based on priority and availability
- **Content Sanitization**: XSS prevention using sanitize-html
- **Performance Tracking**: Metrics collection for each provider
- **Error Handling**: Comprehensive error management and logging

### Provider Priority

1. **OpenAI** (Priority 1) - Primary provider
2. **Ollama** (Priority 2) - Local fallback provider

## Configuration

### Environment Variables

Add these variables to your `.env` file:

```bash
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4
OPENAI_MAX_TOKENS=1000

# Ollama Configuration
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama2
```

### Provider Setup

#### OpenAI Setup
1. Get API key from [OpenAI Platform](https://platform.openai.com/api-keys)
2. Add `OPENAI_API_KEY` to environment variables
3. Choose model (default: gpt-4)

#### Ollama Setup
1. Install Ollama from [ollama.com](https://ollama.com/download)
2. Start Ollama server: `ollama serve`
3. Pull desired model: `ollama pull llama2`
4. Configure `OLLAMA_BASE_URL` (default: http://localhost:11434)

## Usage

### Basic Usage

```typescript
import { aiService } from '../services/aiService';

// Generate a question with context
const result = await aiService.generateQuestion({
  userIncome: '50000-75000',
  employment: 'full-time',
  surveyType: 'financial-assistance',
  previousAnswers: { hasDebt: true }
});

console.log(result.text); // Generated question
console.log(result.provider); // 'openai' or 'ollama'
console.log(result.confidence); // 0.8
```

### Integration with Question Controller

The AIService is integrated into the Question Controller for seamless AI-powered question generation:

```typescript
// In Question Controller (M3_PHASE_03)
async generate(req: Request, res: Response, next: NextFunction): Promise<void> {
  const { useAI, aiContext, text } = req.body;
  
  if (useAI && aiContext) {
    try {
      // Generate question using AI
      const generatedQuestion = await aiService.generateQuestion(aiContext);
      questionText = generatedQuestion.text;
      
      // Store AI metadata for analytics
      aiVersions = {
        generated: true,
        provider: generatedQuestion.provider,
        confidence: generatedQuestion.confidence,
        generatedAt: generatedQuestion.generatedAt,
        originalContext: aiContext
      };
    } catch (error) {
      // Graceful fallback to provided text
      if (!text) {
        return next(createBadRequestError('AI generation failed and no fallback text provided'));
      }
      console.warn('AI generation failed, using provided text:', error);
    }
  }
  
  // Create question with AI or static content
  const question = await questionService.createQuestion({
    surveyId,
    text: questionText,
    aiVersions
  });
}

### Advanced Usage

```typescript
// Check available providers
const providers = aiService.getEnabledProviders();
console.log(providers); // ['openai', 'ollama']

// Get performance metrics
const metrics = aiService.getMetrics();
for (const [provider, stats] of metrics) {
  console.log(`${provider}: ${stats.successCount}/${stats.requestCount} success rate`);
}

// Content sanitization (used internally)
const sanitized = aiService.sanitizeContent('<script>alert("xss")</script>Question text');
console.log(sanitized); // "Question text"
```

## API Reference

### Types

#### QuestionContext
```typescript
interface QuestionContext {
  userIncome?: string;           // User's income bracket
  employment?: string;           // Employment status
  surveyType?: string;           // Type of survey being conducted
  previousAnswers?: Record<string, any>; // Previous answers for context
  targetAudience?: string;       // Target audience description
  metadata?: Record<string, any>; // Additional context metadata
}
```

#### GeneratedQuestion
```typescript
interface GeneratedQuestion {
  text: string;                  // Generated question text
  description?: string;          // Optional description or context
  suggestions?: string[];        // Suggested follow-up questions
  confidence: number;            // Confidence score (0-1)
  provider: 'openai' | 'ollama'; // Provider that generated the question
  generatedAt: Date;             // Generation timestamp
  metadata?: Record<string, any>; // Additional metadata
}
```

#### AIServiceMetrics
```typescript
interface AIServiceMetrics {
  provider: string;              // Provider name
  requestCount: number;          // Total request count
  successCount: number;          // Successful request count
  errorCount: number;            // Error count
  avgResponseTime: number;       // Average response time in milliseconds
  lastUsed: Date;               // Last used timestamp
}
```

### Methods

#### generateQuestion(context: QuestionContext): Promise<GeneratedQuestion>
Generates a survey question using available AI providers with fallback logic.

**Parameters:**
- `context`: Question generation context

**Returns:**
- Promise resolving to GeneratedQuestion

**Throws:**
- Error if all providers fail or no providers are available

#### getEnabledProviders(): AIProviderName[]
Returns list of enabled providers sorted by priority.

#### getMetrics(): Map<string, AIServiceMetrics>
Returns performance metrics for all providers.

#### sanitizeContent(content: string): string
Sanitizes AI-generated content to prevent XSS attacks.

## Error Handling

The service implements comprehensive error handling:

### Provider Errors
- **OpenAI API Errors**: Rate limits, authentication, model errors
- **Ollama Errors**: Connection timeouts, model not found, server errors
- **Network Errors**: Connection failures, DNS resolution issues

### Fallback Behavior
1. Primary provider (OpenAI) is attempted first
2. If OpenAI fails, Ollama is tried as fallback
3. If all providers fail, descriptive error is thrown
4. All errors are logged with context for debugging

### Error Messages
- `No AI providers available` - No providers configured
- `All AI providers failed` - All configured providers failed
- `OpenAI API error: {message}` - OpenAI-specific error
- `Ollama request timeout` - Ollama timeout error

## Performance Monitoring

### Metrics Tracked
- **Request Count**: Total requests per provider
- **Success Rate**: Successful requests / total requests
- **Error Rate**: Failed requests / total requests
- **Response Time**: Average response time in milliseconds
- **Last Used**: Timestamp of last usage

### Logging
All operations are logged with structured data:
- Provider initialization
- Request attempts and results
- Fallback triggers
- Performance metrics updates
- Error conditions

## Security

### Content Sanitization
All AI-generated content is sanitized to prevent XSS attacks:
- HTML tags are removed
- Dangerous scripts are stripped
- Excessive whitespace is normalized

### API Key Security
- Never hardcode API keys in source code
- Use environment variables for configuration
- Validate environment variables on startup
- Log configuration status without exposing secrets

## Testing

### Unit Tests
Comprehensive test suite covers:
- Provider initialization
- Question generation (success and failure)
- Fallback logic
- Content sanitization
- Metrics tracking
- Error handling

### Running Tests
```bash
# Run AI service tests
npm test -- tests/backend/aiService.test.ts

# Run all tests
npm test
```

### Test Coverage
- **Success Scenarios**: Normal operation with each provider
- **Failure Scenarios**: Provider failures and fallback behavior
- **Edge Cases**: Empty responses, timeout errors, configuration issues
- **Integration Tests**: Complete generation workflow

## Troubleshooting

### Common Issues

#### OpenAI API Key Invalid
```
Error: OpenAI API error: Incorrect API key provided
```
**Solution**: Check API key in environment variables and OpenAI dashboard

#### Ollama Connection Failed
```
Error: Ollama request timeout
```
**Solution**: Ensure Ollama is running (`ollama serve`) and accessible

#### No Providers Available
```
Error: No AI providers available
```
**Solution**: Configure at least one provider in environment variables

#### Content Sanitization Issues
**Problem**: Generated content contains HTML
**Solution**: Content is automatically sanitized, but check logs for sanitization failures

### Debug Logging
Enable debug logging for detailed troubleshooting:
```bash
LOG_LEVEL=debug npm start
```

## Performance Optimization

### Best Practices
1. **Provider Selection**: Configure both providers for maximum reliability
2. **Caching**: Consider implementing response caching for similar contexts
3. **Rate Limiting**: Implement rate limiting to avoid API limits
4. **Monitoring**: Monitor metrics to optimize provider selection

### Scaling Considerations
- **Load Balancing**: Consider multiple Ollama instances for high load
- **Connection Pooling**: Reuse HTTP connections where possible
- **Timeout Configuration**: Adjust timeouts based on usage patterns

## Migration Guide

### From Previous Versions
If upgrading from a previous AI integration:

1. Update environment variables to new format
2. Replace direct OpenAI/Ollama calls with aiService
3. Update import statements to use shared types
4. Test fallback behavior thoroughly

### Future Enhancements
Planned improvements:
- Additional AI providers (Anthropic, Cohere)
- Response caching layer
- A/B testing for provider selection
- Advanced prompt engineering
- Streaming responses support

## Contributing

### Development Setup
1. Install dependencies: `npm install`
2. Configure environment variables
3. Run tests: `npm test`
4. Follow existing code patterns

### Code Standards
- Use TypeScript strict mode
- Follow existing service patterns
- Add comprehensive tests for new features
- Document all public methods
- Use structured logging

For questions or support, refer to the main project documentation or create an issue in the repository.