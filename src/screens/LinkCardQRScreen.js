import {useNavigation} from '@react-navigation/core';
import React, {useCallback, useEffect, useState} from 'react';
import {Button, ScrollView, StyleSheet, Text} from 'react-native';
import Dialog from 'react-native-dialog';
import NfcManager, {NfcTech} from 'react-native-nfc-manager';
import {ActivityIndicator, Card, Title} from 'react-native-paper';

const LinkStatus = {
  IDLE: 'idle',
  TAPPING: 'tapping',
  SCANNING: 'scanning',
  LINKING: 'linking',
};

export default function LinkCardQRScreen({route}) {
  // status
  const [linkStatus, setLinkStatus] = React.useState(LinkStatus.IDLE);
  // get data from QR
  const {data} = route.params || {};

  const [cardNonce, setCardNonce] = useState();
  const [cardId, setCardId] = useState();

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
    setCardNonce(data);
    setLinkStatus(LinkStatus.LINKING);
  }, [data]);

  // On status change
  useEffect(() => {
    switch (linkStatus) {
      case LinkStatus.TAPPING:
        setCardId();
        setCardNonce();
        startReading();
        break;
      case LinkStatus.SCANNING:
        setCardNonce();
        navigation.navigate('ScanScreen', {backScreen: 'Link QR Main'});
        break;
      case LinkStatus.LINKING:
        startLinking();
        break;

      default:
        setCardId();
        setCardNonce();
        break;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [linkStatus]);

  const onReadCard = useCallback(event => {
    const {id} = event;
    setCardId(id);
    setLinkStatus(LinkStatus.SCANNING);
  }, []);

  const startReading = useCallback(async () => {
    await NfcManager.start();
    await NfcManager.cancelTechnologyRequest();
    await NfcManager.clearBackgroundTag();
    try {
      console.info('START reading...');
      await NfcManager.requestTechnology(NfcTech.IsoDep);
      const tag = await NfcManager.getTag();

      console.info('tag:');
      console.dir(tag);
      onReadCard(tag);
    } catch (e) {
      setLinkStatus(LinkStatus.IDLE);
      alert(e);
      console.error(e);
    }
  }, [onReadCard]);

  const startLinking = useCallback(async () => {
    alert(`cardId : ${cardId} \n cardNonce : ${cardNonce}`);
  }, [cardId, cardNonce]);

  return (
    <ScrollView>
      <>
        {linkStatus === LinkStatus.IDLE && (
          <Card style={styles.card}>
            <Card.Content>
              <Title>Tap Card</Title>
              <Text>First tap card</Text>
            </Card.Content>
            <Card.Actions style={styles.spaceAround}>
              <Button
                onPress={() => setLinkStatus(LinkStatus.TAPPING)}
                title="Tap card"
              />
            </Card.Actions>
          </Card>
        )}

        <Dialog.Container visible={linkStatus === LinkStatus.TAPPING}>
          <Dialog.Title style={styles.textBlack}>Tap card baby</Dialog.Title>
          <Text style={styles.activity}>
            <ActivityIndicator size="large" />
          </Text>
          <Dialog.Button
            label="Cancel"
            onPress={() => {
              setCardNonce();
              setLinkStatus(LinkStatus.IDLE);
            }}
          />
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

  activity: {
    textAlign: 'center',
    padding: 20,
  },
});
