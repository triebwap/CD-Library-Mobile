export default {
	startup() {
		//clearStore()
		storeValue('colours', {red: '#dc2626', amber: '#eab308', green: '#16a34a', purple: '#9333ea', brown: '#a16207', blue: '#1e40af', pink: '#db2777', light_blue: '#93c5fd'})
		.then(() => storeValue('font_sizes',{large: '1.25rem', medium: '1rem', small: '0.875rem'}))
		.then(() => storeValue('artist_rownum',0))
		.then(() => storeValue('album_rownum',0))
		.then(() => storeValue('track_rownum',0))
    this.set_collection_owner()
		get_domain.run()
		.then(() => showAlert('Searching for 🎵...'))
		.then(() => get_artists.run())
		.then(() => get_albums.run())
		.then(() => get_tracks.run())
	  .then(() => showAlert('Found '+artists_table.tableData.length+' artist'+(artists_table.tableData.length >1 ? 's' : ''),'success'))
	},
	select_data() {
		showAlert('Searching for 🎵...')
		.then(() => this.set_collection_owner())
		switch (view_select.selectedOptionValue) {
			case 'artist':  
				get_artists.clear()
				.then(() => get_artists.run())
				.then(() => get_albums.run())
				.then(() => get_tracks.run())
				.then(() => showAlert('Found '+artists_table.tableData.length+' artist'+(artists_table.tableData.length >1 ? 's' : ''),'success'))
				break;
			case 'album': 
				get_artists.clear()
				.then(() => get_albums.clear())
				.then(() => get_albums.run())
				.then(() => get_tracks.run())
				.then(() => showAlert('Found '+albums_table.tableData.length+' album'+(albums_table.tableData.length >1 ? 's' : ''),'success'))
				break;
			case 'track':
				get_artists.clear()
				.then(() => get_albums.clear())
				.then(() => get_tracks.clear())
				.then(() => get_tracks.run())
				.then(() => showAlert('Found '+tracks_table.tableData.length+' track'+(tracks_table.tableData.length >1 ? 's' : ''),'success'))
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
		  .then(() => this.play(play_table.selectedRow.play_url))
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
	artists_on_row_selected() {
		get_albums.run({artist_id: artists_table.selectedRow.artist_id})
		.then(() => get_tracks.run({album_id: albums_table.selectedRow.album_id}))
		.then(() =>storeValue('artist_rownum',artists_table.selectedRowIndex))
		.then(() =>storeValue('album_rownum',0))
		.then(() =>storeValue('track_rownum',0))
	},
	albums_on_row_selected() {
		get_tracks.run({album_id: albums_table.selectedRow.album_id})
		.then(() =>storeValue('album_rownum',albums_table.selectedRowIndex))
		.then(() =>storeValue('track_rownum',0))
	},
	tracks_on_row_selected() {
		storeValue('track_rownum',tracks_table.selectedRowIndex)
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
		switch(Tabs.selectedTab) {
			case 'Artists': return (!artists_table.selectedRow.favourite ? 'Add \'' : 'Remove \'')+this.remove_emoji(artists_table.selectedRow.artist)+(!artists_table.selectedRow.favourite ? '\' to' : '\' from')+' favourites'
			case 'Albums': return (!albums_table.selectedRow.favourite ? 'Add \'' : 'Remove \'')+this.remove_emoji(albums_table.selectedRow.album)+(!albums_table.selectedRow.favourite ? '\' to' : '\' from')+' favourites'
			case 'Tracks': return (!tracks_table.selectedRow.favourite ? 'Add \'' : 'Remove \'')+this.remove_emoji(tracks_table.selectedRow.track)+(!tracks_table.selectedRow.favourite ? '\' to' : '\' from')+' favourites'
		}		
	},
	change_collection_button() {
		showModal('collection_modal')
		.then(() => get_owner_name.run({exclude: true}))
	},
	view_select_font_colour() {
		switch (view_select.selectedOptionValue) {
			case 'artist': return appsmith.store.colours.green
			case 'album': return appsmith.store.colours.amber
			case 'track':return appsmith.store.colours.red
		}	
	},
	initcap(string) {
		return string.charAt(0).toUpperCase()+string.slice(1)
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
		.then(() => {if (appsmith.store.play_rec.origin == 'playlist_tracks_table') showModal('playlist_modal')})
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
		.then(() => storeValue('play_rec',{origin: appsmith.store.play_rec.origin,
																			track: this.track_name(tracks_table.selectedRowIndex),
																			play: tracks_table.selectedRow.play}))
	},
	track_id() {
		return !tracks_table.selectedRow.track_id ? tracks_table.tableData[0].track_id : tracks_table.selectedRow.track_id
	},
	youtube_video_on_end() { 
		var play_length = tracks_table.tableData[appsmith.store.play.track_index].play.length
		console.log('play_length '+play_length)
		if (appsmith.store.play.source_index < play_length-1) {
			showAlert('Track ['+this.track_name(appsmith.store.play.track_index)+'] Source ['+this.play_name(appsmith.store.play.track_index,appsmith.store.play.source_index)+'] ended')
			.then(() => storeValue('play',{track_index: appsmith.store.play.track_index, source_index: appsmith.store.play.source_index+1, url: this.play_url(appsmith.store.play.track_index,appsmith.store.play.source_index+1)})) 
			.then(() => showAlert('Now playing... Track ['+this.track_name(appsmith.store.play.track_index)+'] Source ['+this.play_name(appsmith.store.play.track_index,appsmith.store.play.source_index)+']'))
		}
		else if (appsmith.store.play.track_index < tracks_table.tableData.length-1 ) {
			showAlert('Track ['+this.track_name(appsmith.store.play.track_index)+'] Source ['+this.play_name(appsmith.store.play.track_index,appsmith.store.play.source_index)+'] ended')
			.then(() => storeValue('play',{track_index: appsmith.store.play.track_index+1, source_index: 0, url: this.play_url(appsmith.store.play.track_index+1,0)}))
			.then(() => showAlert('Now playing... Track ['+this.track_name(appsmith.store.play.track_index)+'] Source ['+this.play_name(appsmith.store.play.track_index,appsmith.store.play.source_index)+']'))
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
		storeValue('play_rec',{origin: 'play_button',
													 track: this.track_name(tracks_table.selectedRowIndex),
													 play: tracks_table.selectedRow.play})
		.then(() => showModal('play_modal'))
	},
	play_button_tooltip() {
		return !!tracks_table.selectedRow.play ? 'Play ['+this.track_name(tracks_table.selectedRowIndex)+']' : ''
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
			.then(() => get_owner_name.run({exclude: false}))
			.then(() => storeValue('collection_name',get_owner_name.data.map(row => row.get_owner_name)[0][0].label))
		}
		else {
			storeValue('collection_id',!!owner_name_select.selectedOptionValue ? owner_name_select.selectedOptionValue : appsmith.store.collection_id)
			.then(() => storeValue('collection_name',!!owner_name_select.selectedOptionLabel ? owner_name_select.selectedOptionLabel : appsmith.store.collection_name))
			.then(() => get_owner_name.run({exclude: true}))
		}
	}
}