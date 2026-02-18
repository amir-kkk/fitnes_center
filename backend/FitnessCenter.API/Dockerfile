FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Восстановление зависимостей отдельным слоем для кэширования
COPY FitnessCenter.API/FitnessCenter.API.csproj FitnessCenter.API/
RUN dotnet restore FitnessCenter.API/FitnessCenter.API.csproj

# Копирование и сборка
COPY . .
WORKDIR /src/FitnessCenter.API
RUN dotnet publish -c Release -o /app/publish

# Финальный образ
FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY --from=build /app/publish .
EXPOSE 5000
ENV ASPNETCORE_URLS=http://+:5000
ENTRYPOINT ["dotnet", "FitnessCenter.API.dll"]
