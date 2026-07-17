using backend.Models;

namespace backend.Services;

public interface ILlmProvider
{
    Task<TriageResult> TriageAsync(string description, CancellationToken cancellationToken = default);
}
