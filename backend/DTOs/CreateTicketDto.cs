using System.ComponentModel.DataAnnotations;

namespace backend.DTOs;

public record CreateTicketDto(
    [Required, MinLength(1)] string Subject,
    [Required, MinLength(1)] string Description
);
