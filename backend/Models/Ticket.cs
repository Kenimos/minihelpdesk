namespace backend.Models;

public class Ticket
{
    public int Id { get; set; }

    public string Subject { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;

    public TicketCategory Category { get; set; }
    public TicketPriority Priority { get; set; }
    public TicketStatus Status { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public string? SuggestedResponse { get; set; }
    public string? FinalResponse { get; set; }
}

public enum TicketStatus
{
    New,
    InProgress,
    Resolved
}

public enum TicketCategory
{
    Hardware,
    Software,
    Network,
    Access,
    Other
}

public enum TicketPriority
{
    Low,
    Medium,
    High
}
