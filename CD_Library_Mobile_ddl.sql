
DROP   TYPE artist_type_mobile CASCADE;
CREATE TYPE artist_type_mobile AS ("Artist"    TEXT
                                  ,artist      TEXT
                                  ,"#Albums"   INTEGER
                                  ,artist_id   INTEGER
                                  ,album_id    INTEGER
                                  ,album       TEXT
                                  ,track_id    INTEGER
                                  ,"#Playable" INTEGER
                                  ,url         TEXT
                                  ,album_art   TEXT
                                  ,play        TEXT
                                  ,favourite   BOOLEAN
                                 );
DROP TYPE   album_type_mobile CASCADE;
CREATE TYPE album_type_mobile AS ("Album"      TEXT
                                 ,"Shelf"      TEXT
                                 ,"Tracks"     INTEGER
                                 ,"Time"       TEXT
                                 ,"Year"       INTEGER
                                 ,url          TEXT
                                 ,album_art    TEXT
                                 ,artist_id    INTEGER
                                 ,artist       TEXT
                                 ,album_id     INTEGER
                                 ,album        TEXT
                                 ,track_id     INTEGER
                                 ,"# Playable" INTEGER
                                 ,play         TEXT
                                 ,favourite    BOOLEAN
                                 );
DROP TYPE   track_type_mobile CASCADE;
CREATE TYPE track_type_mobile AS ("Track"    TEXT
                                 ,"Duration" TEXT
                                 ,play       TEXT
                                 ,artist_id  INTEGER
                                 ,artist     TEXT
                                 ,album_id   INTEGER
                                 ,album      TEXT
                                 ,track_id   INTEGER
                                 ,url        TEXT
                                 ,album_art  TEXT
                                 ,favourite  BOOLEAN
                                 );