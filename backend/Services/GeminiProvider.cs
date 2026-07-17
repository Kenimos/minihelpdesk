using backend.Models;

namespace backend.Services;

public class GeminiProvider : ILlmProvider
{
    private readonly IConfiguration _configuration;

    public GeminiProvider(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public Task<TriageResult> TriageAsync(string description, CancellationToken cancellationToken = default)
    {
        // TODO: implementace volání Gemini (Google.GenAI) a parsování JSON odpovědi
        throw new NotImplementedException();
    }
}
