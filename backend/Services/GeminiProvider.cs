using backend.Models;
using Google.GenAI;
using Google.GenAI.Types;
using SchemaType = Google.GenAI.Types.Type;

namespace backend.Services;

public class GeminiProvider : ILlmProvider
{
    private const string Model = "gemini-3.1-flash-lite";

    private static readonly Schema TriageSchema = new Schema
    {
        Type = SchemaType.Object,
        Title = "TriageResult",
        Properties = new Dictionary<string, Schema>
        {
            {
                "category", new Schema
                {
                    Type = SchemaType.String,
                    Format = "enum",
                    Enum = new List<string> { "Hardware", "Software", "Network", "Access", "Other" }
                }
            },
            {
                "priority", new Schema
                {
                    Type = SchemaType.String,
                    Format = "enum",
                    Enum = new List<string> { "Low", "Medium", "High" }
                }
            },
            {
                "suggested_response", new Schema { Type = SchemaType.String }
            }
        },
        PropertyOrdering = new List<string> { "category", "priority", "suggested_response" },
        Required = new List<string> { "category", "priority", "suggested_response" }
    };

    private static readonly TimeSpan Timeout = TimeSpan.FromSeconds(20);

    private readonly Client _client;

    public GeminiProvider(IConfiguration configuration)
    {
        var apiKey = configuration["Gemini:ApiKey"];
        _client = new Client(apiKey: apiKey);
    }

    public async Task<TriageResult> TriageAsync(string description, CancellationToken cancellationToken = default)
    {
        var prompt =
            $"""
             Jsi AI asistent interní IT podpory. Na základě popisu ticketu níže urči kategorii, prioritu
             a navrhni odpověď pro uživatele v češtině.

             Popis ticketu:
             {description}
             """;

        using var timeoutCts = new CancellationTokenSource(Timeout);
        using var linkedCts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken, timeoutCts.Token);

        string json;
        try
        {
            var response = await _client.Models.GenerateContentAsync(
                model: Model,
                contents: prompt,
                config: new GenerateContentConfig
                {
                    ResponseMimeType = "application/json",
                    ResponseSchema = TriageSchema
                },
                cancellationToken: linkedCts.Token
            );

            json = response.Candidates?.FirstOrDefault()?.Content?.Parts?.FirstOrDefault()?.Text
                   ?? throw new LlmTriageException("Gemini vrátil prázdnou odpověď.");
        }
        catch (OperationCanceledException ex) when (timeoutCts.IsCancellationRequested)
        {
            throw new LlmTriageException($"Gemini triáž vypršela ({Timeout.TotalSeconds}s timeout).", ex);
        }
        catch (LlmTriageException)
        {
            throw;
        }
        catch (Exception ex)
        {
            throw new LlmTriageException("Volání Gemini API selhalo.", ex);
        }

        return TriageResultParser.Parse(json);
    }
}
