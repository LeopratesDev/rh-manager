namespace RhManager.Application.Common.Exceptions;

public class NotFoundException(string resource, object id)
    : Exception($"{resource} com id '{id}' não foi encontrado.");
