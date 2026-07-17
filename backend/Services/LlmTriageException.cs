namespace backend.Services;

public class LlmTriageException : Exception
{
    public LlmTriageException(string message, Exception? innerException = null)
        : base(message, innerException)
    {
    }
}
