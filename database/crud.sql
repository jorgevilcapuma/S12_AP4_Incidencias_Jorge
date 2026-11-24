-- =============================================
-- Sistema de Gestión de Incidencias - Jorge Vilcapuma
-- Procedimientos CRUD: Listar, Crear, Editar, Eliminar (lógico), Restaurar, Eliminar definitivo
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

USE IncidenciasDB;
GO

-- ---------- LISTAR (todos) ----------
CREATE OR ALTER PROCEDURE dbo.sp_Incidencias_Listar
AS
BEGIN
    SET NOCOUNT ON;
    SELECT Id, Codigo, Titulo, Descripcion, Responsable, Prioridad, Estado, Fecha,
           CASE WHEN Activo = 1 THEN 'Activo' ELSE 'Inactivo' END AS Registro
    FROM dbo.Incidencias
    ORDER BY Id DESC;
END
GO

-- ---------- CREAR ----------
CREATE OR ALTER PROCEDURE dbo.sp_Incidencias_Crear
    @Titulo      NVARCHAR(100),
    @Descripcion NVARCHAR(500),
    @Responsable NVARCHAR(80),
    @Prioridad   NVARCHAR(10),
    @Estado      NVARCHAR(15) = 'Pendiente',
    @Fecha       DATE = NULL
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO dbo.Incidencias (Titulo, Descripcion, Responsable, Prioridad, Estado, Fecha)
    VALUES (@Titulo, @Descripcion, @Responsable, @Prioridad, @Estado,
            ISNULL(@Fecha, CAST(GETDATE() AS DATE)));

    SELECT * FROM dbo.Incidencias WHERE Id = SCOPE_IDENTITY();
END
GO

-- ---------- EDITAR ----------
CREATE OR ALTER PROCEDURE dbo.sp_Incidencias_Editar
    @Id          INT,
    @Titulo      NVARCHAR(100),
    @Descripcion NVARCHAR(500),
    @Responsable NVARCHAR(80),
    @Prioridad   NVARCHAR(10),
    @Estado      NVARCHAR(15),
    @Fecha       DATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE dbo.Incidencias
    SET Titulo = @Titulo, Descripcion = @Descripcion, Responsable = @Responsable,
        Prioridad = @Prioridad, Estado = @Estado, Fecha = @Fecha,
        ActualizadoEn = SYSDATETIME()
    WHERE Id = @Id;

    SELECT * FROM dbo.Incidencias WHERE Id = @Id;
END
GO

-- ---------- ELIMINAR (lógico: pasa a Inactivo) ----------
CREATE OR ALTER PROCEDURE dbo.sp_Incidencias_Eliminar
    @Id INT
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE dbo.Incidencias SET Activo = 0, ActualizadoEn = SYSDATETIME() WHERE Id = @Id;
    SELECT * FROM dbo.Incidencias WHERE Id = @Id;
END
GO

-- ---------- RESTAURAR (vuelve a Activo) ----------
CREATE OR ALTER PROCEDURE dbo.sp_Incidencias_Restaurar
    @Id INT
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE dbo.Incidencias SET Activo = 1, ActualizadoEn = SYSDATETIME() WHERE Id = @Id;
    SELECT * FROM dbo.Incidencias WHERE Id = @Id;
END
GO

-- ---------- ELIMINAR DEFINITIVO (solo inactivas) ----------
CREATE OR ALTER PROCEDURE dbo.sp_Incidencias_EliminarDefinitivo
    @Id INT
AS
BEGIN
    SET NOCOUNT ON;
    DELETE FROM dbo.Incidencias WHERE Id = @Id AND Activo = 0;
    SELECT @@ROWCOUNT AS FilasEliminadas;
END
GO

/* =============================================
   EJEMPLOS DE USO (selecciona una línea y presiona F5)
   =============================================

-- Listar todos
EXEC dbo.sp_Incidencias_Listar;

-- Crear
EXEC dbo.sp_Incidencias_Crear
     @Titulo = N'Monitor sin señal Lab 02',
     @Descripcion = N'El monitor de la PC 15 del laboratorio 02 no muestra imagen.',
     @Responsable = N'Jorge Vilcapuma',
     @Prioridad = 'Media';

-- Editar (cambia el Id por el que quieras)
EXEC dbo.sp_Incidencias_Editar
     @Id = 1, @Titulo = N'Falla de red Lab 04',
     @Descripcion = N'Los equipos del laboratorio 04 no tienen acceso a internet desde la mañana.',
     @Responsable = N'Carlos Ramos', @Prioridad = 'Alta', @Estado = 'Resuelta', @Fecha = '2026-11-23';

-- Eliminar (pasa a Inactivo)
EXEC dbo.sp_Incidencias_Eliminar @Id = 2;

-- Restaurar (vuelve a Activo)
EXEC dbo.sp_Incidencias_Restaurar @Id = 2;

-- Eliminar definitivamente (solo si está Inactivo)
EXEC dbo.sp_Incidencias_EliminarDefinitivo @Id = 2;

-- Ver todo
SELECT * FROM dbo.Incidencias;
*/
