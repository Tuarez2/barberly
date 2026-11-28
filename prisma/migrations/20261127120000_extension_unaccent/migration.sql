-- Busqueda sin tildes de GET /barberias (BUS-01, BUS-02; especificacion busqueda, Duda 3).
-- Sin indice: con ILIKE '%texto%' un btree no se usa y el volumen del MVP no lo justifica.
CREATE EXTENSION IF NOT EXISTS unaccent;
