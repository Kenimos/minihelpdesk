using System.Text.Json;
using backend.Models;

namespace backend.Services;

// Cisty parser LLM odpovedi, oddeleny od GeminiProvider aby sel snadno testovat
// bez nutnosti mockovat Gemini klienta.
public static class TriageResultParser
{
    public static TriageResult Parse(string? json)
    {
        if (string.IsNullOrWhiteSpace(json))
        {
            throw new LlmTriageException("Gemini vrátil prázdnou odpověď.");
        }

        try
        {
            using var doc = JsonDocument.Parse(json);
            var root = doc.RootElement;

            var categoryText = root.GetProperty("category").GetString();
            var priorityText = root.GetProperty("priority").GetString();
            var suggestedResponse = root.GetProperty("suggested_response").GetString();

            if (string.IsNullOrWhiteSpace(categoryText) ||
                string.IsNullOrWhiteSpace(priorityText) ||
                string.IsNullOrWhiteSpace(suggestedResponse))
            {
                throw new LlmTriageException("Gemini vrátil neúplný JSON.");
            }

            if (!Enum.TryParse<TicketCategory>(categoryText, ignoreCase: true, out var category))
            {
                throw new LlmTriageException($"Gemini vrátil neznámou kategorii: '{categoryText}'.");
            }

            if (!Enum.TryParse<TicketPriority>(priorityText, ignoreCase: true, out var priority))
            {
                throw new LlmTriageException($"Gemini vrátil neznámou prioritu: '{priorityText}'.");
            }

            return new TriageResult
            {
                Category = category,
                Priority = priority,
                SuggestedResponse = suggestedResponse
            };
        }
        catch (LlmTriageException)
        {
            throw;
        }
        catch (JsonException ex)
        {
            throw new LlmTriageException("Gemini vrátil nevalidní JSON.", ex);
        }
        catch (KeyNotFoundException ex)
        {
            throw new LlmTriageException("Gemini vrátil JSON s chybějícími poli.", ex);
        }
        catch (InvalidOperationException ex)
        {
            throw new LlmTriageException("Gemini vrátil JSON s chybějícími poli.", ex);
        }
    }
}
