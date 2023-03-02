
drop  type artist_type_mobile;
create type artist_type_mobile as ("Artist" text
                                  ,artist text
                                  ,"#Albums" int
                                  ,artist_id int
                                  ,album_id int
                                  ,album text
                                  ,track_id int
                                  ,"#Playable" int
                                  ,url text
                                  ,album_art text
                                  ,play text
                                 );
drop type album_type_mobile;
create type album_type_mobile as ("Album" text
                                 ,"Shelf" text
                                 ,"Tracks" int
                                 ,"Time" text
                                 ,"Year" int
                                 ,url text
                                 ,album_art text
                                 ,artist_id int
                                 ,artist text
                                 ,album_id int
                                 ,album text
                                 ,track_id int
                                 ,"# Playable" int
                                 ,play text
                                 );
drop type track_type_mobile;
create type track_type_mobile as ("Track" text
                                 ,"Duration" text
                                 ,play text
                                 ,artist_id int
                                 ,artist text
                                 ,album_id int
                                 ,album text
                                 ,track_id int
                                 ,url text
                                 ,album_art text
                                 );