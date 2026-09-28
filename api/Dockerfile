FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY RhManager.slnx Directory.Build.props ./
COPY src/RhManager.Api/RhManager.Api.csproj src/RhManager.Api/
COPY src/RhManager.Application/RhManager.Application.csproj src/RhManager.Application/
COPY src/RhManager.Domain/RhManager.Domain.csproj src/RhManager.Domain/
COPY src/RhManager.Infrastructure/RhManager.Infrastructure.csproj src/RhManager.Infrastructure/
RUN dotnet restore src/RhManager.Api/RhManager.Api.csproj

COPY src/ src/
RUN dotnet publish src/RhManager.Api/RhManager.Api.csproj -c Release -o /app --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
COPY --from=build /app .
USER $APP_UID
ENV ASPNETCORE_HTTP_PORTS=8080
EXPOSE 8080
ENTRYPOINT ["dotnet", "RhManager.Api.dll"]
