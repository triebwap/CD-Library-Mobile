export default {
	startup: () => {
		storeValue('colours', {red: '#dc2626', amber: '#eab308', green: '#16a34a', purple: '#9333ea', brown: '#a16207', blue: '#1e40af', pink: '#db2777', light_blue: '#93c5fd'})
		storeValue('font_sizes',{large: '1.25rem', medium: '1.25rem', small: '0.875rem'})
		storeValue('artist_rownum',0)
		storeValue('album_rownum',0)
    storeValue('track_rownum',0)
		.then(() => artists_api.run())
		.then(() => albums_api.run({artist_id: artists_Table.selectedRow.artist_id}))
		.then(() => tracks_api.run({album_id: albums_Table.selectedRow.album_id}))
		},
	select_data: () => {
		closeModal('collection_modal')
		.then(() => storeValue('collection_id',!!owner_name_select.selectedOptionValue ? owner_name_select.selectedOptionValue : (!!appsmith.store.collection_id ? appsmith.store.collection_id : 1)))
    .then(() => this.startup())
	},
	play: () => {
	  if (tracks_Table.selectedRow.play.match('/.*youtube.*/')) showModal('youtube_modal')
		else navigateTo(tracks_Table.selectedRow.play, {}, 'NEW_WINDOW')
	},
	scale_font: (string_length) => {
    if (string_length <=12 | !string_length) return appsmith.store.font_sizes.large
	  else if (string_length >12 & string_length <=16) return appsmith.store.font_sizes.medium
	  else return appsmith.store.font_sizes.small 
	},
	tab_accent_colour: () => {
    switch(Tabs.selectedTab) {
    case 'Artists': return appsmith.store.colours.green
    case 'Albums': return appsmith.store.colours.amber
    case 'Tracks': return appsmith.store.colours.red
    }		
	},
	artists_on_row_selected: () => {
		albums_api.run({artist_id: artists_Table.selectedRow.artist_id})
    .then(() => tracks_api.run({album_id: albums_Table.selectedRow.album_id}))
    storeValue('artist_rownum',artists_Table.selectedRowIndex)
    storeValue('album_rownum',0)
    storeValue('track_rownum',0)
	},
	albums_on_row_selected: () => {
		tracks_api.run({album_id: albums_Table.selectedRow.album_id})
    storeValue('album_rownum',albums_Table.selectedRowIndex)
    storeValue('track_rownum',0)
	},
	tracks_on_row_selected: () => {
		storeValue('track_rownum',tracks_Table.selectedRowIndex)
	},
	toggle_favourites: () => {
	  switch(Tabs.selectedTab) {
		case 'Artists':
			toggle_favourites.run({object_id: artists_Table.selectedRow.artist_id, object_type: 'artist'})
		  .then(() => artists_api.run())
		  break;
    case 'Albums':
			toggle_favourites.run({object_id: albums_Table.selectedRow.album_id, object_type: 'album'})
		  .then(() => albums_api.run({artist_id: artists_Table.selectedRow.artist_id}))
		  break;
	  case 'Tracks':
			toggle_favourites.run({object_id: tracks_Table.selectedRow.track_id, object_type: 'track'})
		  .then(() => tracks_api.run({album_id: albums_Table.selectedRow.album_id}))
		}
	},
	toggle_favourites_tooltip: () => {
		switch(Tabs.selectedTab) {
    case 'Artists': return (!artists_Table.selectedRow.favourite ? 'Add \'' : 'Remove \'')+artists_Table.selectedRow.Artist.match(/[\w].*/)[0]+(!artists_Table.selectedRow.favourite ? '\' to' : '\' from')+' favourites'
    case 'Albums': return (!albums_Table.selectedRow.favourite ? 'Add \'' : 'Remove \'')+albums_Table.selectedRow.Album.match(/[\w].*/)[0]+(!albums_Table.selectedRow.favourite ? '\' to' : '\' from')+' favourites'
    case 'Tracks': return (!tracks_Table.selectedRow.favourite ? 'Add \'' : 'Remove \'')+tracks_Table.selectedRow.Track.match(/[^/d/.\W][\w].*/)[0]+(!tracks_Table.selectedRow.favourite ? '\' to' : '\' from')+' favourites'
    }		
	}
}