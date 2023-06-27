import Clipboard from '@react-native-clipboard/clipboard';
import {useFocusEffect} from '@react-navigation/native';
import React, {useEffect, useState} from 'react';
import {
  ActivityIndicator,
  Button,
  NativeEventEmitter,
  NativeModules,
  ScrollView,
  Text,
  ToastAndroid,
  View,
} from 'react-native';
import {Card, Paragraph, Title} from 'react-native-paper';

const CardStatus = {
  IDLE: 'idle',
  READING: 'reading',
  CREATING_CARD: 'creating_card',
  WRITING: 'writing',
};

const eventEmitter = new NativeEventEmitter();

export default function CreateBulkBoltcardScreen(props) {
  const [cardReadInfo, setCardReadInfo] = useState('');
  const [ndef, setNdef] = useState('pending...');
  const [cardUID, setCardUID] = useState();
  const [cardStatus, setCardStatus] = useState(CardStatus.IDLE);
  const [key0Changed, setKey0Changed] = useState('Key 0 version pending');
  const [key1Changed, setKey1Changed] = useState('Key 1 version pending');
  const [key2Changed, setKey2Changed] = useState('Key 2 version pending');
  const [key3Changed, setKey3Changed] = useState('Key 3 version pending');
  const [key4Changed, setKey4Changed] = useState('Key 4 version pending');

  // Add Listeners
  useEffect(() => {
    const readEventListener = eventEmitter.addListener(
      'CardHasBeenRead',
      event => {
        setCardReadInfo(event.cardReadInfo);
        setNdef(event.ndef);
        setCardUID(event.cardUID && event.cardUID.toLowerCase());
        console.log(
          event.key0Changed,
          event.key1Changed,
          event.key2Changed,
          event.key3Changed,
          event.key4Changed,
        );
        setKey0Changed('Key 0 version: ' + event.key0Changed);
        setKey1Changed('Key 1 version: ' + event.key1Changed);
        setKey2Changed('Key 2 version: ' + event.key2Changed);
        setKey3Changed('Key 3 version: ' + event.key3Changed);
        setKey4Changed('Key 4 version: ' + event.key4Changed);

        eventListener.remove();
        setReadEventListener();
        // create request
        requestCreateCard();
      },
    );

    const writeEventListener = eventEmitter.addListener(
      'CreateBoltCard',
      event => {
        if (event.tagTypeError) setTagTypeError(event.tagTypeError);
        if (event.cardUID) setCardUID(event.cardUID);
        if (event.tagname) setTagname(event.tagname);

        if (event.key0Changed) setKey0Changed(event.key0Changed);
        if (event.key1Changed) setKey1Changed(event.key1Changed);
        if (event.key2Changed) setKey2Changed(event.key2Changed);
        if (event.key3Changed) setKey3Changed(event.key3Changed);
        if (event.key4Changed) setKey4Changed(event.key4Changed);
        if (event.uid_privacy) setPrivateUID(event.uid_privacy == 'Y');

        if (event.ndefWritten) setNdefWritten(event.ndefWritten);
        if (event.writekeys) setWriteKeys(event.writekeys);

        if (event.readNDEF) {
          setNdefRead(event.readNDEF);
          //we have the latest read from the card fire it off to the server.
          const httpsLNURL = event.readNDEF.replace('lnurlw://', 'https://');
          fetch(httpsLNURL)
            .then(response => response.json())
            .then(json => {
              setTestBolt('success');
            })
            .catch(error => {
              setTestBolt('Error: ' + error.message);
            });
        }

        if (event.testp) setTestp(event.testp);
        if (event.testc) setTestc(event.testc);

        NativeModules.MyReactModule.setCardMode('read');
        setWriteMode(false);
      },
    );

    return () => {
      readEventListener.remove();
      writeEventListener.remove();

      alert('HASDA');
      setCardStatus(CardStatus.IDLE);
    };
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      NativeModules.MyReactModule.setCardMode('read');
    }, []),
  );

  const resetOutput = () => {
    setTagTypeError(null);
    setTagname(null);
    setCardUID(null);
    setKey0Changed(null);
    setKey1Changed(null);
    setKey2Changed(null);
    setKey3Changed(null);
    setKey4Changed(null);
    setNdefWritten(null);
    setWriteKeys(null);
  };

  const writeAgain = () => {
    resetOutput();
    NativeModules.MyReactModule.setCardMode('createBoltcard');
    setWriteMode(true);
  };

  const requestCreateCard = async () => {
    setCardStatus(CardStatus.CREATING_CARD);

    // Make request to create card
  };

  const startReading = () => {
    setCardStatus(CardStatus.READING);

    ToastAndroid.showWithGravity(
      'Start reading...',
      ToastAndroid.SHORT,
      ToastAndroid.TOP,
    );
  };

  const startWriting = () => {
    ToastAndroid.showWithGravity(
      'Start writing...',
      ToastAndroid.SHORT,
      ToastAndroid.TOP,
    );
  };

  return (
    <ScrollView style={{}}>
      {[CardStatus.READING, CardStatus.WRITING].includes(cardStatus) ? (
        <Text
          style={{
            margin: 20,
            fontWeight: 'bold',
            fontSize: 15,
            textAlign: 'center',
          }}>
          <ActivityIndicator /> Hold NFC card to Reader
        </Text>
      ) : (
        <Card style={{marginBottom: 20, marginHorizontal: 10}}>
          <Button onPress={startReading} title="Start reading" />
        </Card>
      )}

      <Card style={{marginBottom: 20, marginHorizontal: 10}}>
        <Card.Content>
          <Title>Status ({cardStatus})</Title>
          <Paragraph style={{fontWeight: 'bold', fontSize: 15}}>
            Falta escanear 1 vez
          </Paragraph>
        </Card.Content>
      </Card>

      <Card style={{marginBottom: 20, marginHorizontal: 10}}>
        <Card.Content>
          <Title>Card Keys</Title>
          <Paragraph>{key0Changed}</Paragraph>
          <Paragraph>{key1Changed}</Paragraph>
          <Paragraph>{key2Changed}</Paragraph>
          <Paragraph>{key3Changed}</Paragraph>
          <Paragraph>{key4Changed}</Paragraph>
        </Card.Content>
      </Card>

      <Text></Text>
    </ScrollView>
  );
}
