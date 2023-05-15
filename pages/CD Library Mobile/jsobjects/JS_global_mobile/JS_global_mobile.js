export default {
	startup() {
		storeValue('colours', {red: '#dc2626', amber: '#eab308', green: '#16a34a', purple: '#9333ea', brown: '#a16207', blue: '#1e40af', pink: '#db2777', light_blue: '#93c5fd'})
		storeValue('font_sizes',{large: '1.25rem', medium: '1.25rem', small: '0.875rem'})
		storeValue('artist_rownum',0)
		storeValue('album_rownum',0)
    storeValue('track_rownum',0)
    this.select_data()
		},
	select_data() {
		closeModal('collection_modal')
		.then(() => storeValue('collection_id',!!owner_name_select.selectedOptionValue ? owner_name_select.selectedOptionValue : (!!appsmith.store.collection_id ? appsmith.store.collection_id : 1)))
    .then(() => storeValue('collection_name',!!owner_name_select.selectedOptionLabel ? owner_name_select.selectedOptionLabel : (!!appsmith.store.collection_name ? appsmith.store.collection_name : '')))
		switch (view_RadioGroup.selectedOptionValue) {
		case 'artist':  
			artist_api.clear()
			.then(() => artist_api.run())
		  .then(() => album_api.run())
			.then(() => track_api.run())
			.then(() => showAlert('Found '+artists_table.tableData.length+' artist'+(artists_table.tableData.length >1 ? 's' : ''),'success'))
			break;
		case 'album': 
			album_api.clear()
			.then(()=> album_api.run())
			.then(() => track_api.run())
			.then(() => showAlert('Found '+albums_table.tableData.length+' album'+(albums_table.tableData.length >1 ? 's' : ''),'success'))
			break;
    case 'track':
			artist_api.clear()
			.then(() => track_api.clear())
			.then(() => track_api.run())
			.then(() => showAlert('Found '+tracks_table.tableData.length+' track'+(tracks_table.tableData.length >1 ? 's' : ''),'success'))
		}
	},
	play() {
	  if (tracks_table.selectedRow.play.match('/.*youtube.*/')) showModal('youtube_modal')
		else navigateTo(tracks_table.selectedRow.play, {}, 'NEW_WINDOW')
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
		album_api.run({artist_id: artists_table.selectedRow.artist_id})
    .then(() => track_api.run({album_id: albums_table.selectedRow.album_id}))
    storeValue('artist_rownum',artists_table.selectedRowIndex)
    storeValue('album_rownum',0)
    storeValue('track_rownum',0)
	},
	albums_on_row_selected() {
		track_api.run({album_id: albums_table.selectedRow.album_id})
    storeValue('album_rownum',albums_table.selectedRowIndex)
    storeValue('track_rownum',0)
	},
	tracks_on_row_selected() {
		storeValue('track_rownum',tracks_table.selectedRowIndex)
	},
	toggle_favourites() {
	  switch(Tabs.selectedTab) {
		case 'Artists':
			toggle_favourites.run({object_id: artists_table.selectedRow.artist_id, object_type: 'artist'})
		  .then(() => artist_api.run())
		  break
    case 'Albums':
			toggle_favourites.run({object_id: albums_table.selectedRow.album_id, object_type: 'album'})
		  .then(() => album_api.run({artist_id: artists_table.selectedRow.artist_id}))
		  break
	  case 'Tracks':
			toggle_favourites.run({object_id: tracks_table.selectedRow.track_id, object_type: 'track'})
		  .then(() => track_api.run({album_id: albums_table.selectedRow.album_id}))
		}
	},
	toggle_favourites_tooltip() {
		switch(Tabs.selectedTab) {
    case 'Artists': return (!artists_table.selectedRow.favourite ? 'Add \'' : 'Remove \'')+artists_table.selectedRow.Artist.match(/[\w].*/)[0]+(!artists_table.selectedRow.favourite ? '\' to' : '\' from')+' favourites'
    case 'Albums': return (!albums_table.selectedRow.favourite ? 'Add \'' : 'Remove \'')+albums_table.selectedRow.Album.match(/[\w].*/)[0]+(!albums_table.selectedRow.favourite ? '\' to' : '\' from')+' favourites'
    case 'Tracks': return (!tracks_table.selectedRow.favourite ? 'Add \'' : 'Remove \'')+tracks_table.selectedRow.Track.match(/[^/d/.\W][\w].*/)[0]+(!tracks_table.selectedRow.favourite ? '\' to' : '\' from')+' favourites'
    }		
	},
	change_collection_button() {
    showModal('collection_modal')
    .then(() => owner_name_api.run())
  },
	view_RadioGroup() {
		showAlert(this.initcap(view_RadioGroup.selectedOptionValue)+' view selected','success')
    .then(() => this.select_data())
  },
	view_RadioGroup_accent_colour() {
    switch (view_RadioGroup.selectedOptionValue) {
		case 'artist': return appsmith.store.colours.green
		case 'album': return appsmith.store.colours.amber
    case 'track':return appsmith.store.colours.red
		}	
  },
	initcap(string) {
		return string.charAt(0).toUpperCase()+string.slice(1)
	},
  favourite_check() {
		artist_api.clear()
		.then(() => artist_api.run())
    .then(() => album_api.run())
    .then(() => track_api.run())
    .then(() => showAlert((/true/).test(favourites_RadioGroup.selectedOptionValue) ? 'Favourites Only Selected' : 'All Selected','success'))
	}
}