namespace backend.Models;

public enum TriageStatus
{
    Success,
    Error
}

public class TriageResponse
{
    public TriageStatus Status { get; set; }
    public TriageResult? Result { get; set; }
    public string? ErrorMessage { get; set; }
}
