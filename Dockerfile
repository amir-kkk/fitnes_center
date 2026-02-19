# ════════════════════════════════════════
# Этап 1: Сборка фронтенда (React + Vite)
# ════════════════════════════════════════
FROM node:20-alpine AS frontend
WORKDIR /app
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm install
COPY frontend/ .
RUN npm run build

# ════════════════════════════════════════
# Этап 2: Сборка бэкенда (ASP.NET Core)
# ════════════════════════════════════════
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS backend
WORKDIR /src
COPY backend/FitnessCenter.API/FitnessCenter.API.csproj FitnessCenter.API/
RUN dotnet restore FitnessCenter.API/FitnessCenter.API.csproj
COPY backend/ .
WORKDIR /src/FitnessCenter.API
RUN dotnet publish -c Release -o /app/publish

# ════════════════════════════════════════
# Этап 3: Финальный образ
# Бэкенд раздаёт и API, и статику фронтенда
# ════════════════════════════════════════
FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY --from=backend /app/publish .
COPY --from=frontend /app/dist ./wwwroot
EXPOSE 5000
ENV ASPNETCORE_URLS=http://+:5000
ENTRYPOINT ["dotnet", "FitnessCenter.API.dll"]
