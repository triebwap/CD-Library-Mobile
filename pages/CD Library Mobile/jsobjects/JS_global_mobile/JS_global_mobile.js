export default {
	startup() {
		storeValue('colours', {red: '#dc2626', amber: '#eab308', green: '#16a34a', purple: '#9333ea', brown: '#a16207', blue: '#1e40af', pink: '#db2777', light_blue: '#93c5fd'})
		storeValue('font_sizes',{large: '1.25rem', medium: '1rem', small: '0.875rem'})
		storeValue('selected_artist',undefined)
		storeValue('selected_album',undefined)
		storeValue('selected_track',undefined)
		storeValue('page_size', 100)
    this.set_collection_owner()
		get_domain.run()
		.then(() => get_artist_objects.run())
		.then(() => this.initialise_selected())
	},
	artist: {
	  delete() {
		  const artist = this.remove_emoji(artists_table.selectedRow.artist)
		  delete_artist.run({artist: [{artist_id: artists_table.selectedRow.artist_id}]})
		  .then(() => {
			storeValue('selected_artist',undefined)
			.then(() => get_artist_objects.run({offset: this.get_offset()}))
			.then(() => showAlert('Artist ['+artist+'] deleted','success'))
		})
		.catch(() => showAlert('Unable to delete artist: '+delete_artist.data.match(/.*/)[0],'error'))
	  }
	},
	album: {
		delete() {
	    const album = this.remove_emoji(albums_table.selectedRow.album)
		  delete_album.run({album: [{album_id: albums_table.selectedRow.album_id}]})
		  .then(() => {
			  storeValue('selected_album',undefined)
			  .then(() => get_artist_objects.run({offset: this.get_offset()}))
			  .then(() => showAlert('Album ['+album+'] deleted','success'))
		  })
		.catch(() => showAlert('Unable to delete album: '+delete_album.data.match(/.*/)[0],'error'))
	  },
	  insert_tracks() {
		  closeModal('discogs_modal')
		  insert_album.run({
			  collection_id: appsmith.store.collection_id,
			  artist_id: insert_discogs_artist.data.map(row => row.insert_discogs_artist)[0],
			  album: search_albums_table.selectedRow.title,
			  shelf: '',
			  tracks: search_tracks_table.tableData.length,
			  time: this.sum_duration().concat(':'),
			  year: search_albums_table.selectedRow.year,
			  genre: genre_table.selectedRow.Genre,
			  url: '',
			  album_art: search_albums_table.selectedRow.cover_image,
			  favourite: false})
		  .then(() => {
			  search_tracks_table.tableData.forEach((element, index) => {
				  insert_track.run({
			      album_id: insert_album.data.map(row => row.insert_album)[0].album_id,
			      track_number: index+1,
			      track: element.title.replace('\'','\'\''),
			      duration: element.duration.concat(':'),
			      play: [{"play_url":"","play_name":""}],
			      favourite: false,
			      collection_id: appsmith.store.collection_id
		      })
				  .catch(() => showAlert('Insert Track Failed: '+insert_track.data.match(/.*/)[0],'error'))
			  }) 
			  .then(() => get_artist_objects.run({offset: this.get_offset()}))
				.then(() => storeValue('selected_artist',insert_discogs_artist.data.map(row => row.insert_discogs_artist)[0]))
			  .then(() => storeValue('selected_album',insert_album.data.map(row => row.insert_album)[0].album_id))
			  .then(() => get_artist_objects.run({offset: this.get_offset()}))
				.then(() => showAlert('Album ['+search_albums_table.selectedRow.title+'] added','success'))
			})
		.catch(() => showAlert('Insert Album Failed: '+insert_album.data.match(/.*/)[0],'error'))
	  }
	},
	track: {
	  delete() {
			const track = this.track_name(tracks_table.selectedRowIndex)
		  delete_track.run({track: [{track_id: tracks_table.selectedRow.track_id}]})
		  .then(() => {
			  storeValue('selected_track',undefined)
			  .then(() => get_artist_objects.run({offset: this.get_offset()}))
			  .then(() => showAlert('Track ['+track+'] deleted','success'))
		  })
		  .catch(() => showAlert('Unable to delete track(s): '+delete_track.data.match(/Album.*disabled/)[0],'error'))
	  }
	},
	select_data() {
		storeValue('selected_artist',undefined)
		storeValue('selected_album',undefined)
		storeValue('selected_track',undefined)
		this.set_collection_owner()
		switch (view_select.selectedOptionValue) {
			case 'artist':  
				get_artist_objects.run()
				.then(() => this.initialise_selected()); break
			case 'album':
				get_albums.run({artist_id: -1})
				.then(() => get_tracks.run({album_id: albums_table.selectedRow.album_id}))
				.then(() => this.initialise_selected()); break
			case 'track':
				get_tracks.run({album_id: -1})
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
      case 'artist': storeValue('selected_artists',artists_table.selectedRows.map(row => row.artist_id)); break
      case 'album': storeValue('selected_albums',albums_table.selectedRows.map(row => row.album_id))
								   .then(() => get_tracks.run({album_id: albums_table.selectedRow.album_id})); break	
	    case 'track':	storeValue('selected_tracks',tracks_table.selectedRows.map(row => row.track_id))
	  }
	},
	toggle_favourites() {
		switch(Tabs.selectedTab) {
			case 'Artists':
				toggle_favourites.run({object_id: artists_table.selectedRow.artist_id, object_type: 'artist'})
				.then(() => get_artist_objects.run({offset: this.get_offset()})); break
			case 'Albums':
				toggle_favourites.run({object_id: albums_table.selectedRow.album_id, object_type: 'album'})
				.then(() => get_artist_objects.run({offset: this.get_offset()})); break
			case 'Tracks':
				toggle_favourites.run({object_id: tracks_table.selectedRow.track_id, object_type: 'track'})
				.then(() => get_artist_objects.run({offset: this.get_offset()}))
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
		this.select_data()
		showAlert(favourites_Checkbox.isChecked ? 'Favourites Only Selected' : 'All Selected','success')
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
				array[play_table.updatedRowIndices[0]] = (play_table.updatedRows.map(row => row.allFields))[0]; break
			case 'add': 
				source = play_table.newRow.play_name
				array.push(play_table.newRow); break
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
		.then(() => get_artist_objects.run({offset: this.get_offset()}))
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
		return !!tracks_table.selectedRow.play ? '['+this.track_name(tracks_table.selectedRowIndex)+'] play sources' : ''
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
		  case 'artist': return this.remove_emoji(tracks_table.selectedRow.artist)
      case 'album': return this.remove_emoji(tracks_table.selectedRow.album)
    }
  },
	artists_table_default_selected_rows() {
		const index = _.findIndex(artists_table.tableData,(element) => element.artist_id == appsmith.store.selected_artist)
		return index < 0 ? 0 : index
	},
	albums_table_default_selected_rows() {
		const index = _.findIndex(albums_table.tableData,(element) => element.album_id == appsmith.store.selected_album)
		return index < 0 ? 0 : index
	},
	tracks_table_default_selected_rows() {
		const index = _.findIndex(tracks_table.tableData,(element) => element.track_id == appsmith.store.selected_track)
		return index < 0 ? 0 : index
	},
	view_select_options() {
    return get_domain.data.map(row => row.get_domain)[0].sort((a,b) => ((a.value == 'track' && b.value  == 'artist') ? 1 : (a.value == 'track' && b.value  == 'album') ? 1 :-1))
  },
	play_button_colour() {
    return tracks_table.selectedRowIndex !=-1 && !!tracks_table.selectedRow.play[0].play_url ?appsmith.store.colours.purple : 'black'
  },
  album_button_tooltip(text,type) {
		if (type == 'W') return !!albums_table.selectedRow.url ? '['+this.remove_emoji(albums_table.selectedRow.album)+'] '+text : 'No '+text+' available'
		else if (type == 'A') return !!albums_table.selectedRow.album_art ? '['+this.remove_emoji(albums_table.selectedRow.album)+'] '+text : 'No '+text+' available'
	},
	initialise_selected() {
    if (artists_table.tableData.length != 0) storeValue('selected_artist',artists_table.tableData[0].artist_id)
		else if (albums_table.tableData.length != 0) storeValue('selected_artist',albums_table.tableData[0].artist_id) 	
	  else storeValue('selected_artist',tracks_table.tableData[0].artist_id)
    if (albums_table.tableData.length != 0) storeValue('selected_album',albums_table.tableData[0].album_id)
		else storeValue('selected_album',tracks_table.tableData[0].album_id)
    storeValue('selected_track',tracks_table.tableData[0].track_id)
  },
	discogs_search_query(type) {
    switch (this.get_tab()) {
			case 'artist': {
				if (type == 'artist') return discogs_search_input.text != this.remove_emoji(artists_table.selectedRow.artist) ? discogs_search_input.text : this.remove_emoji(artists_table.selectedRow.artist)
				else return  ''; break
			}
			case 'album': {
				if (type == 'album') return discogs_search_input.text != this.remove_emoji(albums_table.selectedRow.album) ? discogs_search_input.text : this.remove_emoji(albums_table.selectedRow.album)
				else return '' ; break
			}
			case 'track':  {
				if (type == 'track') return discogs_search_input.text != this.track_name(tracks_table.selectedRowIndex) ? discogs_search_input.text : this.track_name(tracks_table.selectedRowIndex)
				else return ''
			}
		}
	},
	search_change_page(direction) {
		if (direction == 'next') 
			if (discogs_search_api.data.pagination.page == discogs_search_api.data.pagination.pages) showAlert('At last page','warning')
		  else this.search_button(discogs_search_api.data.pagination.page+1)
		else if (direction == 'previous') 
			if (discogs_search_api.data.pagination.page == 1) showAlert('At first page','warning')
		  else this.search_button(discogs_search_api.data.pagination.page-1)
	},
	search_page_button_tooltip(direction) {
		if (discogs_search_api.data == undefined) return ''
		if (direction == 'next')
			if (discogs_search_api.data.pagination.page == discogs_search_api.data.pagination.pages) return 'At last page'
		  else return 'Go to page '+(discogs_search_api.data.pagination.page+1)
		else if (direction == 'previous')
			if (discogs_search_api.data.pagination.page == 1) return 'At first page'
		  else return 'Go to page '+(discogs_search_api.data.pagination.page-1)
	},
	search_button(page) {
		if (!search_page_select.isDirty) search_page_select.setSelectedOption(({ label: '1', value: 1 }))
		showModal('discogs_modal')
		.then(() => discogs_search_api.run({page: page,
																			 artist: this.discogs_search_query('artist'),
																			 album: this.discogs_search_query('album'),
																			 track: this.discogs_search_query('track')}))
		.then(() => {
			showAlert('Found '+discogs_search_api.data.pagination.items+' matches: page '+discogs_search_api.data.pagination.page+' of '+discogs_search_api.data.pagination.pages+' pages','success')
			discogs_master_api.run() 
		  .catch(() => {
				const error = discogs_master_api.data.message
				if (error == 'The requested resource was not found.') showAlert('No master release data available','warning')
		    else showAlert(discogs_master_api.data.message,'error')
			})
		})
	},
	search_button_tooltip() {
		const tab = this.get_tab()
    return 'Search on Discogs for '+tab+' ['+this.discogs_search_query(tab)+']'
  },
	search_albums_table_data() {
		return !!discogs_search_api.data ? discogs_search_api.data.results : ''
	},
	search_tracks_table_data() {
		return !!discogs_master_api.responseMeta.isExecutionSuccess ? discogs_master_api.data.tracklist.filter(element => element.type_ == 'track').map(row => {return {title: row.title, position: row.position, duration: row.duration}}) : ''
	},
	page_number_select(tot_pages) {
		const pages = [];
		for (let i = 0; i < tot_pages; i++) {
			pages[i] = {"label": i+1,"value": i+1}
		} return pages
	},
	search_albums_table_on_row_selected() {
		discogs_master_api.run() 
		if (!!search_albums_table.selectedRow.master_id && search_albums_table.selectedRow.master_id != 0) {
			discogs_master_api.run()
		} else showAlert('No master release data available','warning')
		.catch(() => showAlert(discogs_master_api.data.message,'error'))
	},
	discogs_insert_album_button() {
		insert_discogs_artist.run({artist: discogs_search_input.text != this.remove_emoji(artists_table.selectedRow.artist) ? discogs_master_api.data.artists[0].name : this.remove_emoji(artists_table.selectedRow.artist)})
		.then(() => this.album.insert_tracks())
	},
	sum_duration() {
		var minutes = 0
		var seconds = 0
		search_tracks_table.tableData.map(row => row.duration).forEach(element => {
			minutes += Number(element.match(/[^:]/))
			seconds += Number(element.match(/[^:]*$/))
		})
		minutes += Math.trunc(seconds/60)
		seconds %= 60
		return minutes+':'+(seconds.toString().length == 1 ? '0'+seconds.toString() : seconds)
	},
	discogs_modal_text() {
		const tab = this.get_tab()
		if (discogs_search_api.data == undefined) return ''
    else return 'Discogs Search Results for '+tab+' ['+this.discogs_search_query(tab)+'] page '+discogs_search_api.data.pagination.page+' of '+(!discogs_search_api.data ? '' : discogs_search_api.data.pagination.pages)
  },
	delete_modal_text() {
		const tab = this.get_tab()
		switch (tab) {
			case 'artist': return 'Delete '+tab+' ['+this.remove_emoji(artists_table.selectedRow.artist)+']' 
			case 'album': return 'Delete '+tab+' ['+this.remove_emoji(albums_table.selectedRow.album)+']' 
			case 'track': return 'Delete '+tab+' ['+this.track_name(tracks_table.selectedRowIndex)+']' 
		}
	},
	delete_modal_delete_button() {
		closeModal('delete_modal')
		switch (this.get_tab()) {
			case 'artist': this.artist.delete(); break
			case 'album': this.album.delete(); break
			case 'track': this.track.delete()			
	  }
	},
	discogs_search_input() {
		switch (this.get_tab()) {
			case 'artist': return this.remove_emoji(artists_table.selectedRow.artist)
			case 'album': return this.remove_emoji(albums_table.selectedRow.album)
			case 'track': return this.track_name(tracks_table.selectedRowIndex)
	  }
	},
	get_tab() {
		return this.initcap(Tabs.selectedTab).match(/.*[^s]/)[0]
	},
	search_album_art_button(source_button,album_art) {
		storeValue('source_button',source_button)
		.then(() => storeValue('album_art',album_art))
		.then(() => showModal('album_art_modal'))
	},
	close_album_art_button() {
		if (appsmith.store.source_button == 'search_album_art_button') showModal('discogs_modal')
		else closeModal('album_art_modal')
	},
	get_offset() {
		var page_number
		switch (view_select.selectedOptionValue) {
			case 'artist': page_number =  artists_table.tableData.length > 0 ? artists_table.tableData[0].page_number : 0; break
			case 'album': page_number =  albums_table.tableData.length > 0 ? albums_table.tableData[0].page_number : 0; break
			case 'track': page_number =  tracks_table.tableData.length > 0 ? tracks_table.tableData[0].page_number : 0
		}
		return ((page_number || 1)-1)*appsmith.store.page_size
	},	
	albums_table_data() {
		if (view_select.selectedOptionValue == 'album') return get_albums.data.map(row => row.get_albums_desktop)[0]
		else return _.sortBy(artists_table.selectedRow.albums,'album')
	},
	tracks_table_data() {
		if (view_select.selectedOptionValue == 'track' || view_select.selectedOptionValue == 'album') return get_tracks.data.map(row => row.get_tracks_desktop)[0]
		else return albums_table.selectedRow.tracks
	},
	data_page_button(direction) {
		var offset
		function get_new_offset(old_offset,direction) {
			if (direction == 'next') return old_offset+appsmith.store.page_size
			else if (direction == 'previous') return old_offset-appsmith.store.page_size
		}
		showAlert('Loading data...')
		switch (view_select.selectedOptionValue) {
			case 'artist': 
				offset = get_new_offset((artists_table.selectedRow.page_number-1)*appsmith.store.page_size,direction)
				get_artist_objects.run({offset: offset}); break
			case 'album':
				offset = get_new_offset((albums_table.selectedRow.page_number-1)*appsmith.store.page_size,direction)
				get_albums.run({offset: offset, artist_id: artists_table.selectedRow.artist_id})
				.then(() => get_tracks.run({album_id: get_albums.data.map(row => row.get_albums_desktop)[0][0].album_id})); break
			case 'track':
				offset = get_new_offset((tracks_table.selectedRow.page_number-1)*appsmith.store.page_size,direction)
				get_tracks.run({offset: offset, album_id: -1})
		}
	},
	data_page_button_tooltip(direction) {
		var page_number
		var total_pages
		function page_text(page_number,total_pages) {
			return 'Go to page '+(page_number)+' of '+total_pages+' '+view_select.selectedOptionValue+' page'+(total_pages >1 ? 's' : '')
		}   
		switch (view_select.selectedOptionValue) {
			case 'artist': 
				page_number = artists_table.selectedRow.page_number
				total_pages = artists_table.selectedRow.total_pages; break
			case 'album': 
				page_number = albums_table.selectedRow.page_number
				total_pages = albums_table.selectedRow.total_pages; break
			case 'track': 
				page_number = tracks_table.selectedRow.page_number
				total_pages = tracks_table.selectedRow.total_pages; break
		}
		if (direction == 'next' && page_number < total_pages) return page_text(page_number+1,total_pages)
		else if (direction == 'previous' && page_number > 1) return page_text(page_number-1,total_pages)
		else return ''
	},
	data_page_button_disabled(direction) {
		function is_disabled(direction,page_number,total_pages) {
			if (direction == 'next') return page_number == total_pages
			else if (direction == 'previous') return page_number == 1
		}
		switch (view_select.selectedOptionValue) {
			case 'artist': return is_disabled(direction,artists_table.selectedRow.page_number,artists_table.selectedRow.total_pages)
			case 'album':  return is_disabled(direction,albums_table.selectedRow.page_number,albums_table.selectedRow.total_pages)
			case 'track': return is_disabled(direction,tracks_table.selectedRow.page_number,tracks_table.selectedRow.total_pages)
		}
	},
	pages_text() {
    function text(page_number,total_pages) {
  	  return 'Page '+page_number+' of '+total_pages
		}
    switch (view_select.selectedOptionValue) {
			case 'artist': return text(artists_table.selectedRow.page_number,artists_table.selectedRow.total_pages)
			case 'album': return text(albums_table.selectedRow.page_number,albums_table.selectedRow.total_pages)
			case 'track': return text(tracks_table.selectedRow.page_number,tracks_table.selectedRow.total_pages)
		}
  },
	pages_text_visible() {
    return view_select.selectedOptionValue == this.get_tab() || !get_artist_objects.isLoading
  },
	add_emoji(key,favourite){
    return view_select.selectedOptionValue == 'artist' && favourite ? key+'⭐' : key
  }
}