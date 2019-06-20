import React, {Component} from 'react';
import {
  ActivityIndicator,
  Animated,
  AsyncStorage,
  Button,
  Image,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  YellowBox,
} from 'react-native';
import PropTypes from 'prop-types';

import Video from 'react-native-video';
import { api, analytics } from 'boxcast-sdk-js';

import Badge from './Badge';


// Static initialization
YellowBox.ignoreWarnings([
  'Accessing view manager configs',
  'Invalid image url',
  'source.uri should not be',
  'Task orphaned',
  'Remote debugger is in a background tab',
]);
analytics.configure({
  browser_name: 'React Native',
  browser_version: '1.0',
  player_version: 'boxcast-test-react-native-app v1.0'
});


type Props = {
  broadcast: object,
  onDismiss?: () => mixed,
};

export default class Broadcast extends Component<Props> {
  static propTypes = {
    broadcast: PropTypes.object.isRequired,
    onDismiss: PropTypes.func,
  };

  static defaultProps = {
    onDismiss: function(){},
  };

  state = {
    view: {},
    error: null,
    loading: true,
  };

  constructor(props) {
    super(props);
    this.playerRef = React.createRef();

    // TODO: re-enable analytics
    /*this.analytics = analytics.mode('react-native-video').attach({
      broadcast: this.props.broadcast,
      channel_id: this.props.broadcast.channel_id,
      AsyncStorage: AsyncStorage
    });*/
  }

  componentDidMount() {
    api.views.get(this.props.broadcast.id).then((view) => {
      this.setState({view: view, error: null, loading: false});
    }).catch((err) => {
      var error = err.response.data;
      if (error.error_description) {
        error = `${error.error_description}`;
      } else {
        error = `Error: ${JSON.stringify(error)}`;
      }
      this.setState({view: {}, error: error, loading: false});
    });
  }

  componentDidUpdate() {
    // console.log('Updated. Video player player: ', this.playerRef.current);
    this.playerRef.current && this.playerRef.current.presentFullscreenPlayer();
  }

  componentWillUnmount() {
    // console.log('Unmounting video player');
  }

  shouldComponentUpdate(nextProps, nextState) {
    // Never fire an update on this sub-tree unless playlist is changing
    if (!this.state.view.playlist || this.state.view.playlist !== nextState.view.playlist) {
      return true;
    } else {
      return false;
    }
  }

  render() {
    const { view, error } = this.state;

    return (
      <View style={styles.fullScreen}>
        {view.playlist ? this.renderVideo(view.playlist) : this.renderPlaceholder()}
      </View>
    );
  }

  renderVideo(playlist) {
    return (
      <Video
        source={{uri: playlist}}
        ref={this.playerRef}
        style={styles.fullScreen}
        controls={true}
        poster={this.props.broadcast.poster || this.props.broadcast.preview}
      />
    );
    // TODO: re-enable analytics props on <Video>
        /* {...this.analytics.generateVideoEventProps()} */
  }

  renderPlaceholder() {
    const { view, error, loading } = this.state;
    const { timeframe, starts_at } = this.props.broadcast;
    
    if (loading) {
      return (
        <View style={styles.container}>
          <ActivityIndicator animating size="large" />
        </View>
      );
    } else if (timeframe == 'future') {
      return this.renderError('default', `Broadcast starts ${starts_at}`);
    } else if (error && error.toLowerCase().indexOf('payment') >= 0) {
      return this.renderError('warning', 'Ticketed broadcasts cannot be viewed in the app.');
    } else {
      return this.renderError('warning', error || 'This video is not available.');
    }
  }

  renderError(type, msg) {
    return (
      <View style={styles.container}>
        <Image
          source={{uri: this.props.broadcast.preview}}
          style={styles.fullScreen}
          resizeMode={'cover'}
          pointerEvents={'none'}
        />
        <Badge type={type} text={msg} />
      </View>
    );
  }
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  title: {
    fontSize: 20,
    textAlign: 'center',
    margin: 10,
    backgroundColor: '#000000',
    color: '#ffffff',
  },
  error: {
    fontSize: 20,
    backgroundColor: 'orange',
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
    margin: 10,
  },
  fullScreen: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
  },
});
