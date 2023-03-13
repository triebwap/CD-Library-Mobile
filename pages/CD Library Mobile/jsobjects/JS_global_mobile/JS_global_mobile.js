export default {
	startup: () => {
		              storeValue('response',undefined)
		              .then(() => storeValue('button_colours',{artists: '#16a34a', albums: '#eab308', tracks: '#ef4444'}))
		              .then(() => storeValue('font_sizes',{large: '1.25rem', medium: '1.25rem', small: '0.875rem'}))
		              .then(() => storeValue('level','artist'))
									.then(() => storeValue('up_button',appsmith.store.button_colours.artists))
									.then(() => storeValue('down_button',appsmith.store.button_colours.albums))
									.then(() => storeValue('artist_rownum',0))
									.then(() => this.select_data())
								 },
	select_data: () => {
		closeModal('collection_modal')
		storeValue('collection_id',!!owner_name_select.selectedOptionValue ? owner_name_select.selectedOptionValue : (!!appsmith.store.collection_id ? appsmith.store.collection_id : 1))
		.then(() => storeValue('level','artist'))
		.then(() => storeValue('artist_rownum',0))
		.then(() => storeValue('album_rownum',0))
		.then(() => storeValue('track_rownum',0))
		.then(() => storeValue('artist_search',''))
		.then(() => storeValue('album_search',''))
		.then(() => storeValue('track_search',''))
		.then(() => this.query_artists(appsmith.store.collection_id))
	},
	play: () => {
	  if (dynamic_table.selectedRow.play.match('/.*youtube.*/')) showModal('youtube_modal')
		else navigateTo(dynamic_table.selectedRow.play, {}, 'NEW_WINDOW')
	},
	drill: (direction) => {
		switch(appsmith.store.level) {
    case 'artist':
			if (direction == 'down')
			  {
				this.query_albums(appsmith.store.collection_id,dynamic_table.selectedRow.artist_id)
				storeValue('down_button',appsmith.store.button_colours.tracks)
				storeValue('level','album')
				storeValue('album_search','')
				}
      break;
    case 'album':
			if (direction == 'up')
			  {
				storeValue('up_button',appsmith.store.button_colours.artists)
				storeValue('down_button',appsmith.store.button_colours.albums)
				storeValue('level','artist')
				storeValue('album',null)
				this.query_artists(appsmith.store.collection_id)
				}
		  else if (direction == 'down')
			  {
			  storeValue('up_button',appsmith.store.button_colours.albums)
				storeValue('down_button',appsmith.store.button_colours.artists)
				storeValue('level','track')
				storeValue('track_search','')
				this.query_tracks(appsmith.store.collection_id, dynamic_table.selectedRow.album_id)
			  }
		  break;
	  case 'track':
			if (direction == 'up') {
				storeValue('up_button',appsmith.store.button_colours.artists)
				storeValue('down_button',appsmith.store.button_colours.tracks)
				storeValue('level','album')
				storeValue('response',undefined)
				this.query_albums(appsmith.store.collection_id, dynamic_table.selectedRow.artist_id)
			}
			else if (direction == 'down') {
				storeValue('up_button',appsmith.store.button_colours.artists)
				storeValue('down_button',appsmith.store.button_colours.albums)
				storeValue('level','artist')
				storeValue('response',undefined)
				this.query_artists(appsmith.store.collection_id)
			}
		  break;
    }
	},
	label: (direction) => {
		switch(appsmith.store.level) {
    case 'artist':
      if (direction == 'up') return 'Artists'
		  else if (direction == 'down') return 'Albums'
		  break;
    case 'album':
			if (direction == 'up') return 'Artists'
		  else if (direction == 'down') return 'Tracks'
		  break;
	  case 'track':
			if (direction == 'up') return 'Albums'
			else if (direction == 'down') return 'Artists'
		  break;
		}
	},
  row_selected: () => {
		storeValue(`${appsmith.store.level}_search`,dynamic_table.searchText)
    storeValue('level',!!dynamic_table.selectedRow.Artist ? 'artist' : !!dynamic_table.selectedRow.Album ? 'album' : !!dynamic_table.selectedRow.Track ? 'track' : null)
	  switch(appsmith.store.level) {
    case 'artist':
      storeValue('artist_rownum',dynamic_table.selectedRowIndex)
			storeValue('album_rownum',0)
			storeValue('track_rownum',0)
		  break;
    case 'album':
      storeValue('album_rownum',dynamic_table.selectedRowIndex)
			storeValue('track_rownum',0)
		  break;
	  case 'track':
			storeValue('track_rownum',dynamic_table.selectedRowIndex)
		  break;
		}
	},
	row_num: () => {
		switch(appsmith.store.level) {
    case 'artist':
      return appsmith.store.artist_rownum
		  break;
    case 'album':
      return appsmith.store.album_rownum
		  break;
	  case 'track':
			return appsmith.store.track_rownum
		  break;
		}
	},
	search: () => {
    switch(appsmith.store.level) {
		case 'artist':
      return appsmith.store.artist_search
		  break;
    case 'album':
      return appsmith.store.album_search
		  break;
	  case 'track':
			return appsmith.store.track_search
		  break;
		}	
	},
	get_artist: () => {return !!dynamic_table.selectedRow.artist ? dynamic_table.selectedRow.artist : dynamic_table.tableData[0].artist},
	get_album: () => {return !!dynamic_table.selectedRow.album ? dynamic_table.selectedRow.album : dynamic_table.tableData[0].album},
	query_artists: (collection_id) => {
		showAlert('Loading artists...')
		.then(() => storeValue('response',undefined))
		.then(() => storeValue('query_input','SELECT get_artists_mobile(p_collection_id =>'+collection_id+',p_favourites_only =>'+favourites_switch.isSwitchedOn+')'))
		.then(() => query_api.run())
		.then(() => storeValue('response',JSON.parse(query_api.data).data.map((row) =>row.get_artists_mobile)))
	},
  query_albums: (collection_id, artist_id) => {
		showAlert('Loading albums...')
		.then(() => storeValue('response',undefined))
		.then(() => storeValue('query_input','SELECT get_albums_mobile(p_collection_id =>'+collection_id+',p_artist_id =>'+artist_id+',p_favourites_only =>'+favourites_switch.isSwitchedOn+')'))
	  .then(() => query_api.run())
		.then(() => storeValue('response',JSON.parse(query_api.data).data.map((row) =>row.get_albums_mobile)))
	},
  query_tracks: (collection_id, album_id) => {
		showAlert('Loading tracks...')
		.then(() => storeValue('response',undefined))
		.then(() => storeValue('query_input','SELECT get_tracks_mobile(p_collection_id =>'+collection_id+',p_album_id =>'+album_id+',p_favourites_only =>'+favourites_switch.isSwitchedOn+')'))
		.then(() => query_api.run())
		.then(() => {
      if (JSON.parse(query_api.data).data.length == 0) {
				storeValue('level','album')
			  showAlert('No tracks found','warning')
				}
	    else 
		    storeValue('response',JSON.parse(query_api.data).data.map((row) =>row.get_tracks_mobile))			
		})
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
		  break;		
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
		  break;		
		}
	}
}