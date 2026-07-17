using backend.Data;
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

    public TicketsController(AppDbContext context, ILlmProvider llmProvider)
    {
        _context = context;
        _llmProvider = llmProvider;
    }

    // DEBUG: docasny endpoint pro testovani promptu, bez error handlingu
    [HttpPost("debug-triage")]
    public async Task<ActionResult<TriageResult>> DebugTriage([FromBody] string description)
    {
        var result = await _llmProvider.TriageAsync(description);
        return result;
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
    public async Task<ActionResult<Ticket>> CreateTicket(Ticket ticket)
    {
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

    private async Task RunTriageAsync(Ticket ticket)
    {
        var result = await _llmProvider.TriageAsync(ticket.Description);

        ticket.Category = result.Category;
        ticket.Priority = result.Priority;
        ticket.SuggestedResponse = result.SuggestedResponse;

        await _context.SaveChangesAsync();
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
}
