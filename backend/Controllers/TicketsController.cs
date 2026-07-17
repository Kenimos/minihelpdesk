using backend.Data;
using backend.DTOs;
using backend.Models;
using backend.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TicketsController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ILlmProvider _llmProvider;
    private readonly ILogger<TicketsController> _logger;

    public TicketsController(AppDbContext context, ILlmProvider llmProvider, ILogger<TicketsController> logger)
    {
        _context = context;
        _llmProvider = llmProvider;
        _logger = logger;
    }

    // DEBUG: docasny endpoint pro testovani promptu
    [HttpPost("debug-triage")]
    public async Task<ActionResult<TriageResponse>> DebugTriage([FromBody] string description)
    {
        try
        {
            var result = await _llmProvider.TriageAsync(description);
            return new TriageResponse { Status = TriageStatus.Success, Result = result };
        }
        catch (LlmTriageException ex)
        {
            return new TriageResponse { Status = TriageStatus.Error, ErrorMessage = ex.Message };
        }
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Ticket>>> GetTickets()
    {
        return await _context.Tickets.OrderByDescending(t => t.CreatedAt).ToListAsync();
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Ticket>> GetTicket(int id)
    {
        var ticket = await _context.Tickets.FindAsync(id);
        if (ticket == null)
        {
            return NotFound();
        }

        return ticket;
    }

    [HttpPost]
    public async Task<ActionResult<Ticket>> CreateTicket(CreateTicketDto dto)
    {
        var ticket = new Ticket
        {
            Subject = dto.Subject,
            Description = dto.Description,
            Category = default,
            Priority = default,
            Status = TicketStatus.New
        };

        // ticket ulozime hned, aby existoval v DB i kdyz AI triaz selze
        _context.Tickets.Add(ticket);
        await _context.SaveChangesAsync();

        await RunTriageAsync(ticket);

        return CreatedAtAction(nameof(GetTicket), new { id = ticket.Id }, ticket);
    }

    [HttpPost("{id}/recall-llm")]
    public async Task<ActionResult<Ticket>> RecallLlm(int id)
    {
        var ticket = await _context.Tickets.FindAsync(id);
        if (ticket == null)
        {
            return NotFound();
        }

        await RunTriageAsync(ticket);

        return ticket;
    }

    // AI triaz nikdy nesmi shodit request - pri selhani ticket zustane s puvodnimi hodnotami
    private async Task RunTriageAsync(Ticket ticket)
    {
        try
        {
            var result = await _llmProvider.TriageAsync(ticket.Description);

            ticket.Category = result.Category;
            ticket.Priority = result.Priority;
            ticket.SuggestedResponse = result.SuggestedResponse;

            await _context.SaveChangesAsync();
        }
        catch (LlmTriageException ex)
        {
            _logger.LogError(ex, "AI triáž selhala pro ticket {TicketId}", ticket.Id);
        }
    }

    [HttpPatch("{id}/status")]
    public async Task<IActionResult> UpdateStatus(int id, [FromBody] TicketStatus status)
    {
        var ticket = await _context.Tickets.FindAsync(id);
        if (ticket == null)
        {
            return NotFound();
        }

        ticket.Status = status;
        await _context.SaveChangesAsync();

        return NoContent();
    }

    [HttpPatch("{id}/final-response")]
    public async Task<IActionResult> UpdateFinalResponse(int id, [FromBody] string finalResponse)
    {
        var ticket = await _context.Tickets.FindAsync(id);
        if (ticket == null)
        {
            return NotFound();
        }

        ticket.FinalResponse = finalResponse;
        await _context.SaveChangesAsync();

        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteTicket(int id)
    {
        var ticket = await _context.Tickets.FindAsync(id);
        if (ticket == null)
        {
            return NotFound();
        }

        _context.Tickets.Remove(ticket);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}
