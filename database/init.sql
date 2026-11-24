-- =============================================
-- Sistema de Gestión de Incidencias - Jorge Vilcapuma
-- Script de creación de base de datos (SQL Server)
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF DB_ID('IncidenciasDB') IS NULL
    CREATE DATABASE IncidenciasDB;
GO

USE IncidenciasDB;
GO

IF OBJECT_ID('dbo.Incidencias', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Incidencias (
        Id            INT IDENTITY(1,1) PRIMARY KEY,
        Codigo        AS ('INC-' + RIGHT('000' + CAST(Id AS VARCHAR(10)), 3)) PERSISTED,
        Titulo        NVARCHAR(100)  NOT NULL,
        Descripcion   NVARCHAR(500)  NOT NULL,
        Responsable   NVARCHAR(80)   NOT NULL,
        Prioridad     NVARCHAR(10)   NOT NULL
            CONSTRAINT CK_Incidencias_Prioridad CHECK (Prioridad IN ('Alta', 'Media', 'Baja')),
        Estado        NVARCHAR(15)   NOT NULL
            CONSTRAINT CK_Incidencias_Estado CHECK (Estado IN ('Pendiente', 'En proceso', 'Resuelta')),
        Fecha         DATE           NOT NULL CONSTRAINT DF_Incidencias_Fecha DEFAULT (CAST(GETDATE() AS DATE)),
        CreadoEn      DATETIME2      NOT NULL CONSTRAINT DF_Incidencias_CreadoEn DEFAULT (SYSDATETIME()),
        ActualizadoEn DATETIME2      NULL,
        Activo        BIT            NOT NULL CONSTRAINT DF_Incidencias_Activo DEFAULT (1)
    );
END
GO

-- Borrado lógico: 1 = Activo, 0 = Inactivo (se puede restaurar)
IF COL_LENGTH('dbo.Incidencias', 'Activo') IS NULL
    ALTER TABLE dbo.Incidencias
        ADD Activo BIT NOT NULL CONSTRAINT DF_Incidencias_Activo DEFAULT (1);
GO

IF NOT EXISTS (SELECT 1 FROM dbo.Incidencias)
BEGIN
    INSERT INTO dbo.Incidencias (Titulo, Descripcion, Responsable, Prioridad, Estado, Fecha) VALUES
    (N'Falla de red Lab 04',       N'Los equipos del laboratorio 04 no tienen acceso a internet desde la mañana.', N'Carlos Ramos',   'Alta',  'En proceso', '2026-11-23'),
    (N'Error acceso portal',       N'Los estudiantes reportan error 500 al iniciar sesión en el portal académico.', N'María Quispe',   'Media', 'Pendiente',  '2026-11-23'),
    (N'Actualización Office',      N'Actualizar la suite Office a la última versión en el área administrativa.',    N'Luis Torres',    'Baja',  'Resuelta',   '2026-11-22'),
    (N'Proyector dañado Aula 12',  N'El proyector del aula 12 no enciende; se sospecha falla de lámpara.',           N'Ana Huamán',     'Media', 'Pendiente',  '2026-11-21'),
    (N'Impresora atascada Secretaría', N'La impresora de secretaría presenta atascos constantes de papel.',          N'Pedro Salazar',  'Baja',  'En proceso', '2026-11-20');
END
GO
