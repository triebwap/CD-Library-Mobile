export default {
	startup() {
		//clearStore()
		storeValue('colours', {red: '#dc2626', amber: '#eab308', green: '#16a34a', purple: '#9333ea', brown: '#a16207', blue: '#1e40af', pink: '#db2777', light_blue: '#93c5fd'})
		storeValue('font_sizes',{large: '1.25rem', medium: '1rem', small: '0.875rem'})
		storeValue('selected_artist',undefined)
		storeValue('selected_album',undefined)
		storeValue('selected_track',undefined)
    this.set_collection_owner()
		get_domain.run()
		get_artists.run()
		.then(() => get_albums.run())
		.then(() => get_tracks.run())
		.then(() => this.initialise_selected())
	},
	select_data() {
		storeValue('selected_artist',undefined)
		storeValue('selected_album',undefined)
		storeValue('selected_track',undefined)
		this.set_collection_owner()
		switch (view_select.selectedOptionValue) {
			case 'artist':  
				get_artists.run()
				.then(() => get_albums.run())
				.then(() => get_tracks.run())
				.then(() => this.initialise_selected())
				break
			case 'album': 
				get_albums.clear()
				get_albums.run()
				.then(() => get_tracks.run())
				.then(() => this.initialise_selected())
				break
			case 'track':
        get_tracks.clear()
				get_tracks.run()
				.then(() => this.initialise_selected())
		}
	},
	play(play) {
		storeValue('play',{track_index: appsmith.store.play.track_index, source_index: appsmith.store.play.source_index, url: play})
		if (play.match('/.*youtube.*/')) showModal('youtube_modal')
		else navigateTo(play, {}, 'NEW_WINDOW')
	},
	play_table_play_button() {
		if (tracks_table.selectedRow.play.map(row => row.play_url).filter(row => row.match(/^https:.*/) != null).length == 0) 
			showAlert('No playable URLs found','error')
		else {
		  storeValue('play',{track_index: tracks_table.selectedRowIndex, source_index: play_table.selectedRowIndex, url: null})
		  this.play(play_table.selectedRow.play_url)
		}
	},
	scale_font(string_length) {
		if (string_length <=12 | !string_length) return appsmith.store.font_sizes.large
		else if (string_length >12 & string_length <=15) return appsmith.store.font_sizes.medium
		else return appsmith.store.font_sizes.small 
	},
	tab_accent_colour() {
		switch(Tabs.selectedTab) {
			case 'Artists': return appsmith.store.colours.green
			case 'Albums': return appsmith.store.colours.amber
			case 'Tracks': return appsmith.store.colours.red
		}		
	},
	on_row_selected(type) {
    switch (type) {
      case 'artist': 
				storeValue('selected_artist',artists_table.selectedRow.artist_id)
		    get_albums.run()
		    .then(() => get_tracks.run())
				break		
      case 'album':
				storeValue('selected_album',albums_table.selectedRow.album_id)
		    get_tracks.run()
				break		
	    case 'track':
				storeValue('selected_track',tracks_table.selectedRow.track_id)
	  }
	},
	toggle_favourites() {
		switch(Tabs.selectedTab) {
			case 'Artists':
				toggle_favourites.run({object_id: artists_table.selectedRow.artist_id, object_type: 'artist'})
				.then(() => get_artists.run())
				break
			case 'Albums':
				toggle_favourites.run({object_id: albums_table.selectedRow.album_id, object_type: 'album'})
				.then(() => get_albums.run({artist_id: artists_table.selectedRow.artist_id}))
				break
			case 'Tracks':
				toggle_favourites.run({object_id: tracks_table.selectedRow.track_id, object_type: 'track'})
				.then(() => get_tracks.run({album_id: albums_table.selectedRow.album_id}))
		}
	},
	toggle_favourites_tooltip() {
		const tab = this.initcap(Tabs.selectedTab).match(/.*[^s]/)[0]
		switch(Tabs.selectedTab) {
			case 'Artists': 
				return (!artists_table.selectedRow.favourite ? 'Add '+tab+' [' : 'Remove '+tab+' [')+this.remove_emoji(artists_table.selectedRow.artist)+(!artists_table.selectedRow.favourite ? '] to' : '] from')+' favourites'
			case 'Albums': 
				return (!albums_table.selectedRow.favourite ? 'Add '+tab+' [' : 'Remove '+tab+' [')+this.remove_emoji(albums_table.selectedRow.album)+(!albums_table.selectedRow.favourite ? '] to' : '] from')+' favourites'
			case 'Tracks': 
				return (!tracks_table.selectedRow.favourite ? 'Add '+tab+' [' : 'Remove '+tab+' [')+this.remove_emoji(this.track_name(tracks_table.selectedRowIndex))+(!tracks_table.selectedRow.favourite ? '] to' : '] from')+' favourites'
		}		
	},
	change_collection_button() {
		showModal('collection_modal')
		get_owner_name.run({exclude: true})
	},
	view_select_font_colour() {
		switch (view_select.selectedOptionValue) {
			case 'artist': return appsmith.store.colours.green
			case 'album': return appsmith.store.colours.amber
			case 'track':return appsmith.store.colours.red
		}	
	},
	initcap(string) {
		if (string.charAt(0).toUpperCase() != string.charAt(0)) return string.charAt(0).toUpperCase()+string.slice(1)
		else return string.charAt(0).toLowerCase()+string.slice(1)
	},
	favourite_check() {
		get_artists.clear()
		.then(() => get_artists.run())
		.then(() => get_albums.run())
		.then(() => get_tracks.run())
		.then(() => showAlert((/true/).test(favourites_RadioGroup.selectedOptionValue) ? 'Favourites Only Selected' : 'All Selected','success'))
	},
	modal_close_button(modal) {
		closeModal(modal)
		if (appsmith.store.play_rec.origin == 'playlist_tracks_table') showModal('playlist_modal')
	},
	update_play(action,array) {	
		var source
		switch (action) {
			case 'update':
				source = play_table.updatedRow.play_name
				array[play_table.updatedRowIndices[0]] = (play_table.updatedRows.map(row => row.allFields))[0]
				break
			case 'add': 
				source = play_table.newRow.play_name
				array.push(play_table.newRow)
				break
			case 'delete':
				source = play_table.selectedRow.play_name
				array.splice(play_table.selectedRowIndex, 1)
		}
		update_track.run({tracks: [{track_id: tracks_table.selectedRow.track_id,
								                track_number: tracks_table.selectedRow.track_number,
								                track: appsmith.store.play_rec.track,
								                duration: tracks_table.selectedRow.duration,
								                play: array
								               }],
										 collection_id: appsmith.store.collection_id
										 })
		.then(() => get_tracks.run())
		.then(() => showAlert('Source ['+source+'] '+action+(action == 'add' ? 'ed' : 'd'),'success'))
		.then(() => storeValue('play_rec',{origin: appsmith.store.play_rec.origin,track: this.track_name(tracks_table.selectedRowIndex),play: tracks_table.selectedRow.play}))
	},
	youtube_video_on_end() { 
		const play_length = tracks_table.tableData[appsmith.store.play.track_index].play.length
		if (appsmith.store.play.source_index < play_length-1) {
			showAlert('Track ['+this.track_name(appsmith.store.play.track_index)+'] Source ['+this.play_name(appsmith.store.play.track_index,appsmith.store.play.source_index)+'] ended')
			storeValue('play',{track_index: appsmith.store.play.track_index, source_index: appsmith.store.play.source_index+1, url: this.play_url(appsmith.store.play.track_index,appsmith.store.play.source_index+1)}) 
			showAlert('Now playing... Track ['+this.track_name(appsmith.store.play.track_index)+'] Source ['+this.play_name(appsmith.store.play.track_index,appsmith.store.play.source_index)+']')
		}
		else if (appsmith.store.play.track_index < tracks_table.tableData.length-1 ) {
			showAlert('Track ['+this.track_name(appsmith.store.play.track_index)+'] Source ['+this.play_name(appsmith.store.play.track_index,appsmith.store.play.source_index)+'] ended')
			storeValue('play',{track_index: appsmith.store.play.track_index+1, source_index: 0, url: this.play_url(appsmith.store.play.track_index+1,0)})
			showAlert('Now playing... Track ['+this.track_name(appsmith.store.play.track_index)+'] Source ['+this.play_name(appsmith.store.play.track_index,appsmith.store.play.source_index)+']')
		}
		else showAlert('Playlist ended')
	},
	track_name(track_index) {
		return this.remove_emoji(tracks_table.tableData[track_index].track)
	},
	play_name(track_index,source_index) {
		return tracks_table.tableData[track_index].play[source_index].play_name
	},
	play_url(track_index,source_index) {
		return tracks_table.tableData[track_index].play[source_index].play_url
	},
	remove_emoji(text) {
		return text.match(/.*[^\p{Emoji_Presentation}]/gu)[0]
	},
	play_button() {
		storeValue('play_rec',{origin: 'play_button', track: this.track_name(tracks_table.selectedRowIndex),play: tracks_table.selectedRow.play})
		showModal('play_modal')
	},
	play_button_tooltip() {
		return !!tracks_table.selectedRow.play ? 'Showtrack ['+this.track_name(tracks_table.selectedRowIndex)+'] play sources' : ''
	},
	track_emphasis(selectedRowIndex,currentIndex,play_url) {
		return selectedRowIndex == currentIndex && !!play_url ? 'BOLD' : 'NORMAL'
	},
	track_text_colour(selectedRowIndex,currentIndex,play_url) {
		return selectedRowIndex == currentIndex && !!play_url ? appsmith.store.colours.purple : ''
	},
	album_text_colour(album_id) {
		return tracks_table.tableData.filter(row => row.album_id == album_id).filter(row => row.play[0].play_url).length >0 ? appsmith.store.colours.purple : ''
	},
	album_emphasis(album_id) {
	  return tracks_table.tableData.filter(row => row.album_id == album_id).filter(row => row.play[0].play_url).length >0 ? 'BOLD' : 'NORMAL'
	},
	favourite_icon() {
		switch(Tabs.selectedTab) {
			case 'Artists': return artists_table.selectedRow.favourite ? 'star' : 'star-empty'
			case 'Albums': return albums_table.selectedRow.favourite ? 'star' : 'star-empty'
			case 'Tracks': return tracks_table.selectedRow.favourite ? 'star' : 'star-empty'
		}     
  },
	set_collection_owner() {
		closeModal('collection_modal')
	  if (!appsmith.store.collection_id || !appsmith.store.collection_name) {
			storeValue('collection_id', 1)
			get_owner_name.run({exclude: false})
			.then(() => storeValue('collection_name',get_owner_name.data.map(row => row.get_owner_name)[0][0].label))
		}
		else {
			storeValue('collection_id',!!owner_name_select.selectedOptionValue ? owner_name_select.selectedOptionValue : appsmith.store.collection_id)
			storeValue('collection_name',!!owner_name_select.selectedOptionLabel ? owner_name_select.selectedOptionLabel : appsmith.store.collection_name)
			get_owner_name.run({exclude: true})
		}
	},
	title_text(type) {
	  switch (type) {
		  case 'artist':
				return this.remove_emoji(tracks_table.selectedRow.artist)
      case 'album':
				return this.remove_emoji(tracks_table.selectedRow.album)
    }
  },
	row_selected(type) {
	  switch (type) {
      case 'artist':
				return [{artist_id: (artists_table.selectedRowIndex == -1 || artists_table.selectedRowIndex == undefined ? artists_table.tableData[0] : artists_table.selectedRow).artist_id}]
      case 'album':
				return [{album_id: (albums_table.selectedRowIndex == -1 || albums_table.selectedRowIndex == undefined ? albums_table.tableData[0] : albums_table.selectedRow).album_id}]
    }
	},
	default_selected_row(type) {
		var index
	  switch (type) {
      case 'artist': index = _.findIndex(artists_table.tableData,(element) => element.artist_id == appsmith.store.selected_artist); break		
      case 'album': index = _.findIndex(albums_table.tableData,(element) => element.album_id == appsmith.store.selected_album); break		
	    case 'track': index = _.findIndex(tracks_table.tableData,(element) => element.track_id == appsmith.store.selected_track)
	  }
		return index < 0 ? 0 : index
	},
	view_select_options() {
    return get_domain.data.map(row => row.get_domain)[0].sort((a,b) => ((a.value == 'track' && b.value  == 'artist') ? 1 : (a.value == 'track' && b.value  == 'album') ? 1 :-1))
  },
	play_button_colour() {
    return tracks_table.selectedRowIndex !=-1 && !!tracks_table.selectedRow.play[0].play_url ?appsmith.store.colours.purple : 'black'
  },
  album_button_tooltip(text) {
    return !!albums_table.selectedRow.url ? 'Show album ['+JS_global_mobile.remove_emoji(albums_table.selectedRow.album)+'] '+text : ''
  },
	initialise_selected() {
    if (artists_table.tableData.length != 0) storeValue('selected_artist',artists_table.tableData[0].artist_id)
		else	if (albums_table.tableData.length != 0) storeValue('selected_artist',albums_table.tableData[0].artist_id) 	
	  else storeValue('selected_artist',tracks_table.tableData[0].artist_id)
    if (albums_table.tableData.length != 0) storeValue('selected_album',albums_table.tableData[0].album_id)
		else storeValue('selected_album',tracks_table.tableData[0].album_id)
    storeValue('selected_track',tracks_table.tableData[0].track_id)
  }
}