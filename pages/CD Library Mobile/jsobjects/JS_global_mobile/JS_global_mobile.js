export default {
	startup: () => {
		storeValue('response',null)
		.then(() => storeValue('colours', {red: '#dc2626', amber: '#eab308', green: '#16a34a', purple: '#9333ea', brown: '#a16207', blue: '#1e40af', pink: '#db2777', light_blue: '#93c5fd'}))
		.then(() => storeValue('button_colours',{artists: appsmith.store.colours.green, albums: appsmith.store.colours.amber, tracks: appsmith.store.colours.red}))
		.then(() => storeValue('font_sizes',{large: '1.25rem', medium: '1.25rem', small: '0.875rem'}))
		.then(() => storeValue('level','artist'))
		.then(() => storeValue('up_button',appsmith.store.button_colours.artists))
		.then(() => storeValue('down_button',appsmith.store.button_colours.albums))
		.then(() => storeValue('artist_rownum',0))
		.then(() => this.select_data())
		
		},
	select_data: () => {
		closeModal('collection_modal')
		.then(() =>storeValue('collection_id',!!owner_name_select.selectedOptionValue ? owner_name_select.selectedOptionValue : (!!appsmith.store.collection_id ? appsmith.store.collection_id : 1)))
.then(() => artists_api.run())
		.then(() => albums_api.run({artist_id: artists_Table.selectedRow.artist_id}))
		.then(() => tracks_api.run({album_id: albums_Table.selectedRow.album_id}))
	},
	play: () => {
	  if (tracks_Table.selectedRow.play.match('/.*youtube.*/')) showModal('youtube_modal')
		else navigateTo(tracks_Table.selectedRow.play, {}, 'NEW_WINDOW')
	},
	tooltip: (direction) => {
		switch(appsmith.store.level) {
    case 'artist':
      if (direction == 'up') return 'all artists'
		  else if (direction == 'down') return JS_global_mobile.get_artist()+'\'s albums'
		  break;
    case 'album':
			if (direction == 'up') return 'all artists'
		  else if (direction == 'down') return JS_global_mobile.get_album()+'\'s tracks'
		  break;
	  case 'track':
			if (direction == 'up') return JS_global_mobile.get_artist()+'\'s albums'
			else if (direction == 'down') return 'all artists'
		}
	},
	row_num: () => {
		switch(appsmith.store.level) {
    case 'artist': return appsmith.store.artist_rownum
    case 'album': return appsmith.store.album_rownum
	  case 'track': return appsmith.store.track_rownum
		}
	},
	search: () => {
    switch(appsmith.store.level) {
		case 'artist': return appsmith.store.artist_search
    case 'album': return appsmith.store.album_search
	  case 'track': return appsmith.store.track_search
		}	
	},
	query_artists: (collection_id) => {
		query_api.run({query: 'SELECT get_artists_mobile(p_collection_id =>'+collection_id+',p_favourites_only =>'+favourites_switch.isSwitchedOn+')'})
		.then(() => {
			storeValue('response',JSON.parse(query_api.data).data.map((row) => row.get_artists_mobile))
		  .then(() => storeValue('artists',appsmith.store.response))
		})
		.catch(() => showAlert('Error getting artists','error'))
		.then(() => showAlert('Found '+appsmith.store.response.length+' artist'+(appsmith.store.response.length >1 ? 's' : ''),'success'))
	},
  query_albums: (collection_id, artist_id) => {
		query_api.run({query: 'SELECT get_albums_mobile(p_collection_id =>'+collection_id+',p_artist_id =>'+artist_id+',p_favourites_only =>'+favourites_switch.isSwitchedOn+')'})
		.then(() => {
		  storeValue('response',JSON.parse(query_api.data).data.map((row) => row.get_albums_mobile))
		  .then(() => storeValue('albums',appsmith.store.response))
		})
		.catch(() => showAlert('Error getting albums','error'))
		.then(() => showAlert('Found '+appsmith.store.response.length+' album'+(appsmith.store.response.length >1 ? 's' : ''),'success'))
	},
  query_tracks: (collection_id, album_id) => {
		query_api.run({query: 'SELECT get_tracks_mobile(p_collection_id =>'+collection_id+',p_album_id =>'+album_id+',p_favourites_only =>'+favourites_switch.isSwitchedOn+')'})
		.then(() => {
			storeValue('response',JSON.parse(query_api.data).data.map((row) => row.get_tracks_mobile))
			.then(() => storeValue('tracks',appsmith.store.response))
      .then(() => {if (appsmith.store.response.length == 0) {
				storeValue('level','album')
			  showAlert('No tracks found','warning')
				}
			else showAlert('Found '+appsmith.store.response.length+' track'+(appsmith.store.response.length >1 ? 's' : ''),'success')})
		})
		.catch(() => showAlert('Error getting tracks','error'))
	},
	scale_font: (string_length) => {
    if (string_length <=12 | !string_length) return appsmith.store.font_sizes.large
	  else if (string_length >12 & string_length <=16) return appsmith.store.font_sizes.medium
	  else return appsmith.store.font_sizes.small 
	},
	toggle_favourite: () => {
	  switch(appsmith.store.level) {
		case 'artist':
			storeValue('object_id',dynamic_table.selectedRow.artist_id)
			.then(() => toggle_favourite.run())
		  .then(() => this.query_artists(appsmith.store.collection_id))
		  break;
    case 'album':
      storeValue('object_id',dynamic_table.selectedRow.album_id)
			.then(toggle_favourite.run())
			.then(() => this.query_albums(appsmith.store.collection_id,dynamic_table.selectedRow.artist_id))
		  break;
	  case 'track':
			storeValue('object_id',dynamic_table.selectedRow.track_id)
			.then(toggle_favourite.run())
			.then(() => this.query_tracks(appsmith.store.collection_id,dynamic_table.selectedRow.album_id))	
		}
	},
	switch_favourites: () => {
	  switch(appsmith.store.level) {
		case 'artist':
		  this.query_artists(appsmith.store.collection_id)
		  break;
    case 'album':
  		this.query_albums(appsmith.store.collection_id,dynamic_table.selectedRow.artist_id)
		  break;
	  case 'track':
			this.query_tracks(appsmith.store.collection_id,dynamic_table.selectedRow.album_id)
		}
	},
  default_selected_row: () => {
		switch(appsmith.store.level) {
    case 'artist': return appsmith.store.artist_rownum
    case 'album': return appsmith.store.album_rownum
    case 'track': return appsmith.store.track_rownum
    }
	},
	tab_accent_colour: () => {
switch(Tabs.selectedTab) {
    case 'Artists': return appsmith.store.colours.green
    case 'Albums': return appsmith.store.colours.amber
    case 'Tracks': return appsmith.store.colours.red
    }		
	}
}