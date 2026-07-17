namespace backend.Models;

public class TriageResult
{
    public TicketCategory Category { get; set; }
    public TicketPriority Priority { get; set; }
    public string SuggestedResponse { get; set; } = string.Empty;
}
