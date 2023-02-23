
 -- Artist Select Mobile Function ********************************************************************************************** 
DROP FUNCTION get_artists_mobile;
CREATE OR REPLACE FUNCTION get_artists_mobile(p_collection_id   collections.collection_id%TYPE
                                             ,p_favourites_only BOOLEAN
) 
RETURNS SETOF artist_type_mobile AS $$
  SELECT CASE WHEN favourite(p_collection_id,artist_id,'artist') THEN '⭐' ELSE '' END||artist "Artist"
        ,artist
        ,(SELECT COUNT(*) 
          FROM   albums 
          WHERE  albums.artist_id = artists.artist_id 
          GROUP BY artist_id) "#Albums"
        ,artist_id
        ,0 album_id
        ,'' album
        ,0 track_id
        ,(SELECT CASE WHEN (COUNT(*) > 0)  THEN COUNT(*) ELSE NULL END 
          FROM   albums 
          WHERE  albums.artist_id = artists.artist_id
          AND EXISTS (SELECT 1 
                      FROM albums 
                      WHERE albums.artist_id = artists.artist_id 
                      AND EXISTS (SELECT 1 
                                  FROM   tracks 
                                  WHERE  tracks.album_id = albums.album_id AND play LIKE 'https%'))) "#Playable"
        ,NULL url
        ,NULL album_art
        ,NULL play
  FROM  artists 
  WHERE artist_id IN (SELECT artist_id 
                      FROM   albums 
                      WHERE  album_id IN (SELECT album_id 
                                          FROM   album_collections 
                                          WHERE  collection_id = p_collection_id))
  AND 
  (
        favourite(p_collection_id,artist_id,'artist') = p_favourites_only 
  OR      NOT p_favourites_only
  OR    (EXISTS (SELECT 1 
			     FROM   albums 
				 WHERE  albums.artist_id = artists.artist_id 
				 AND    favourite(p_collection_id,album_id,'album')) 
	     AND p_favourites_only)
  OR    (EXISTS (SELECT 1 
				 FROM   tracks
				       ,albums 
				 WHERE albums.artist_id = artists.artist_id 
				 AND   tracks.album_id  = albums.album_id
				 AND   favourite(p_collection_id,track_id,'track')) 
		  AND p_favourites_only)
  )
  ORDER BY UPPER(artist)
$$ LANGUAGE sql;

-- Album Select Mobile Function ********************************************************************************************** 
DROP FUNCTION get_albums_mobile;
CREATE OR REPLACE FUNCTION get_albums_mobile(p_collection_id   collections.collection_id%TYPE
                                            ,p_artist_id       artists.artist_id%TYPE
                                            ,p_favourites_only BOOLEAN
                                            ) 
RETURNS SETOF album_type_mobile AS $$
  SELECT CASE WHEN favourite(p_collection_id,alb.album_id,'album') THEN '⭐' ELSE '' END||album "Album"
        ,shelf  "Shelf"
        ,tracks "Tracks"
        ,time   "Time"
        ,year   "Year"
        ,url
        ,album_art
        ,art.artist_id
        ,art.artist
        ,alb.album_id
        ,alb.album
        ,0       track_id
        ,(SELECT CASE WHEN (COUNT(*) > 0) THEN COUNT(*) ELSE NULL END 
          FROM   tracks 
          WHERE  tracks.album_id = alb.album_id 
          AND     play LIKE 'https%'
         )        "#Playable"
        ,NULL    play 
  FROM  albums  alb
       ,artists art
  WHERE  alb.artist_id = p_artist_id
  AND    alb.artist_id = art.artist_id
  AND    alb.album_id  IN (SELECT album_id 
                           FROM   album_collections 
                           WHERE  collection_id = p_collection_id)
  AND    
  (       ((favourite(p_collection_id,alb.album_id,'album')   AND p_favourites_only) OR NOT p_favourites_only) 
  OR      ((favourite(p_collection_id,art.artist_id,'artist') AND p_favourites_only) OR NOT p_favourites_only) 
  OR     (EXISTS (SELECT 1 
			      FROM   tracks 
				  WHERE  alb.album_id  = tracks.album_id 
				  AND    alb.artist_id = art.artist_id
				  AND    favourite(p_collection_id,track_id,'track')) 
	      AND p_favourites_only)
  )
  ORDER BY year, album
$$ LANGUAGE sql;

 -- Track Select Mobile Function **********************************************************************************************
DROP FUNCTION get_tracks_mobile;
CREATE OR REPLACE FUNCTION get_tracks_mobile(p_album_id        albums.album_id%type
                                            ,p_favourites_only BOOLEAN
                                            ,p_collection_id   collections.collection_id%type
                                            ) 
RETURNS SETOF track_type_mobile AS $$
  SELECT track_number||'. '||CASE WHEN favourite(p_collection_id,tra.track_id,'track') THEN '⭐' ELSE '' END||track "Track"
        ,Duration "Duration"
        ,play
        ,art.artist_id  
        ,art.artist
        ,alb.album_id
        ,alb.album
        ,track_id
        ,NULL url
        ,NULL album_art 
  FROM  tracks  tra
       ,albums  alb
       ,artists art
  WHERE tra.album_id  = p_album_id
  AND   alb.album_id  = tra.album_id
  AND   alb.artist_id = art.artist_id
  AND    
  (  ((favourite(p_collection_id,tra.track_id,'track')   AND p_favourites_only) OR NOT p_favourites_only)
  OR ((favourite(p_collection_id,alb.album_id,'album')   AND p_favourites_only) OR NOT p_favourites_only) 
  OR ((favourite(p_collection_id,art.artist_id,'artist') AND p_favourites_only) OR NOT p_favourites_only) 
  )
  ORDER BY tra.track_number
$$ LANGUAGE sql;

 -- Toggle Favourites Mobile Procedure **********************************************************************************************
CREATE OR REPLACE PROCEDURE toggle_favourites (p_object_id     favourites.object_id%TYPE 
                                              ,p_object_type   favourites.object_type%TYPE 
                                              ,p_collection_id collections.collection_id%TYPE
                                              ) 
AS $$
BEGIN
  IF favourite(p_collection_id,p_object_id,p_object_type) THEN
    DELETE 
    FROM  favourites
    WHERE object_id     = p_object_id
    AND   object_type   = p_object_type
    AND   collection_id = p_collection_id;
  ELSE
    INSERT INTO favourites(collection_id
                          ,object_id
                          ,object_type) 
    VALUES (p_collection_id
           ,p_object_id
           ,p_object_type);
  END IF;
END;
$$ LANGUAGE plpgsql   

-- favourite *******************************************************************************************************
CREATE OR REPLACE FUNCTION favourite(p_collection_id favourites.collection_id%TYPE
                                    ,p_object_id     favourites.object_id%TYPE
                                    ,p_object_type   favourites.object_type%TYPE
                                    ) 
RETURNS BOOLEAN AS $$
  SELECT EXISTS (SELECT 1 
                 FROM   favourites 
                 WHERE  object_id     = p_object_id 
                 AND    object_type   = p_object_type 
                 AND    collection_id = p_collection_id)
$$ LANGUAGE sql;

-- get_owner_name *******************************************************************************************************
DROP FUNCTION get_owner_name;
CREATE OR REPLACE FUNCTION get_owner_name(p_collection_id collections.collection_id%TYPE) 
RETURNS SETOF owner_name_type AS $$
  SELECT owner_name    label
        ,collection_id value 
  FROM   collections
  WHERE  collection_id != p_collection_id
ORDER BY collection_id;
$$ LANGUAGE sql;