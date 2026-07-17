using backend.Models;
using backend.Services;
using Xunit;

namespace backend.Tests;

public class TriageResultParserTests
{
    [Fact]
    public void Parse_ValidJson_ReturnsCorrectTriageResult()
    {
        const string json = """
            {
              "category": "Hardware",
              "priority": "High",
              "suggested_response": "Zkuste zařízení restartovat."
            }
            """;

        var result = TriageResultParser.Parse(json);

        Assert.Equal(TicketCategory.Hardware, result.Category);
        Assert.Equal(TicketPriority.High, result.Priority);
        Assert.Equal("Zkuste zařízení restartovat.", result.SuggestedResponse);
    }

    [Fact]
    public void Parse_MalformedJson_ThrowsLlmTriageException()
    {
        const string malformedJson = "{ \"category\": \"Hardware\" ";

        var ex = Assert.Throws<LlmTriageException>(() => TriageResultParser.Parse(malformedJson));
        Assert.Contains("nevalidní JSON", ex.Message);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void Parse_NullOrEmptyResponse_ThrowsLlmTriageException(string? json)
    {
        var ex = Assert.Throws<LlmTriageException>(() => TriageResultParser.Parse(json));
        Assert.Contains("prázdnou odpověď", ex.Message);
    }

    [Fact]
    public void Parse_UnknownCategoryValue_ThrowsLlmTriageException()
    {
        const string json = """
            {
              "category": "SuperPC",
              "priority": "Medium",
              "suggested_response": "Nějaká odpověď."
            }
            """;

        var ex = Assert.Throws<LlmTriageException>(() => TriageResultParser.Parse(json));
        Assert.Contains("neznámou kategorii", ex.Message);
    }

    [Fact]
    public void Parse_UnknownPriorityValue_ThrowsLlmTriageException()
    {
        const string json = """
            {
              "category": "Software",
              "priority": "Critical",
              "suggested_response": "Nějaká odpověď."
            }
            """;

        var ex = Assert.Throws<LlmTriageException>(() => TriageResultParser.Parse(json));
        Assert.Contains("neznámou prioritu", ex.Message);
    }

    [Fact]
    public void Parse_MissingField_ThrowsLlmTriageException()
    {
        const string json = """
            {
              "category": "Network",
              "priority": "Low"
            }
            """;

        var ex = Assert.Throws<LlmTriageException>(() => TriageResultParser.Parse(json));
        Assert.Contains("chybějícími poli", ex.Message);
    }
}
