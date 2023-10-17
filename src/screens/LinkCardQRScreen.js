import {useNavigation} from '@react-navigation/core';
import React, {useEffect} from 'react';
import {
  Button,
  NativeEventEmitter,
  NativeModules,
  ScrollView,
  StyleSheet,
  Text,
} from 'react-native';
import Dialog from 'react-native-dialog';
import {Card, Title} from 'react-native-paper';

const LinkStatus = {
  IDLE: 'idle',
  SCANNING: 'scanning',
  TAPPING: 'tapping',
};

const eventEmitter = new NativeEventEmitter();

export default function LinkCardQRScreen({route}) {
  // status
  const [linkStatus, setLinkStatus] = React.useState(LinkStatus.IDLE);
  // get data from QR
  const {data} = route.params || {};

  // use navigation
  const navigation = useNavigation();

  // On exit screen
  useEffect(() => {
    const unsubscribe = navigation.addListener('blur', () => {
      // Do something when the screen blurs
      setLinkStatus(LinkStatus.IDLE);
    });

    return unsubscribe;
  }, [navigation]);

  // Return QR Data
  useEffect(() => {
    if (!data) {
      return;
    }
    alert(`HAY DATA: ${data}`);
    setLinkStatus(LinkStatus.TAPPING);
  }, [data]);

  // On status change
  useEffect(() => {
    switch (linkStatus) {
      case LinkStatus.SCANNING:
        navigation.navigate('ScanScreen', {backScreen: 'Link QR Main'});
        break;
      case LinkStatus.TAPPING:
        NativeModules.MyReactModule.setCardMode('read');

        const readEventListener = eventEmitter.addListener(
          'CardHasBeenRead',
          onReadCard,
        );

        return () => {
          return readEventListener.remove();
        };
      default:
        break;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [linkStatus]);

  const onReadCard = event => {
    const {cardId} = event;
    alert(`Card ID: ${cardId}`);
  };

  return (
    <ScrollView>
      <>
        <Card style={styles.card}>
          <Card.Content>
            <Title>Scan QR Code</Title>
            <Text>First scan QR Code</Text>
          </Card.Content>
          <Card.Actions style={styles.spaceAround}>
            <Button
              onPress={() => setLinkStatus(LinkStatus.SCANNING)}
              title="Scan QR Code"
            />
          </Card.Actions>
        </Card>
        <Dialog.Container visible={false}>
          <Dialog.Title style={styles.textBlack}>Tap card baby</Dialog.Title>
          <Dialog.Description>Tap card</Dialog.Description>
          <Dialog.Button label="Cancel" onPress={() => {}} />
          <Dialog.Button label="Continue" onPress={() => {}} />
        </Dialog.Container>
      </>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  card: {
    margin: 20,
  },
  textBlack: {
    color: '#000',
  },

  spaceAround: {
    justifyContent: 'space-around',
  },
});
