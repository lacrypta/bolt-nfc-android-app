import {useNavigation} from '@react-navigation/native';
import React, {useCallback, useEffect, useState} from 'react';
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

const ADMIN_URL = 'http://100.122.192.79:3000/api/cards/create?uuid=';

const eventEmitter = new NativeEventEmitter();

export default function CreateBulkBoltcardScreen(props) {
  const [cardUID, setCardUID] = useState();
  const [cardData, setCardData] = useState({});
  const [tagTypeError, setTagTypeError] = useState();

  const [cardStatus, setCardStatus] = useState(CardStatus.IDLE);
  const [error, setError] = useState();

  const navigation = useNavigation();

  const onReadCard = useCallback(event => {
    const _cardUID = event.cardUID?.toLowerCase();
    setCardUID(_cardUID);
    console.log(
      event.key0Changed,
      event.key1Changed,
      event.key2Changed,
      event.key3Changed,
      event.key4Changed,
    );

    if (event.key0Changed) {
      ToastAndroid.showWithGravity(
        `The card is already setup`,
        ToastAndroid.SHORT,
        ToastAndroid.TOP,
      );
      return;
    }

    // create request
    ToastAndroid.showWithGravity(
      `Read card ${cardUID}`,
      ToastAndroid.SHORT,
      ToastAndroid.TOP,
    );

    requestCreateCard(cardUID);
  }, []);

  const onWriteCard = useCallback(event => {
    if (event.tagTypeError) setTagTypeError(event.tagTypeError);
    if (event.cardUID) setCardUID(event.cardUID);

    if (!event.ndefWritten || !event.writekeys) {
      console.error("We didn't get the ndefWritten or writekeys");
    }

    if (event.readNDEF) {
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

    setCardData();
    setCardStatus(CardStatus.READING);
  }, []);

  const resetOutput = () => {
    setTagTypeError(null);
    setCardUID(null);
  };

  const requestCreateCard = async _cardUID => {
    setCardStatus(CardStatus.CREATING_CARD);
    // Make request to create card

    const url = `${ADMIN_URL}${_cardUID}`;
    // create request
    ToastAndroid.showWithGravity(
      `Creating card : ${url}`,
      ToastAndroid.SHORT,
      ToastAndroid.TOP,
    );

    fetch(url)
      .then(response => response.json())
      .then(json => {
        if (!json.success) {
          setError(data.reason);
          return;
        }
        const data = json.data;
        if (
          !(
            data.lnurlw_base &&
            data.k0 &&
            data.k1 &&
            data.k2 &&
            data.k3 &&
            data.k4
          )
        ) {
          setError(
            'The JSON response must contain lnurlw_base, k0, k1, k2, k3, k4 ',
          );
          return;
        }

        setCardData(data);
        NativeModules.MyReactModule.changeKeys(
          data.lnurlw_base,
          data.k0,
          data.k1,
          data.k2,
          data.k3,
          data.k4,
          false, // data.uid_privacy != undefined && data.uid_privacy == 'Y',
          response => {
            ToastAndroid.showWithGravity(
              'Card Written!',
              ToastAndroid.SHORT,
              ToastAndroid.TOP,
            );

            console.log('Change keys response', response);
            if (response == 'Success') startWriting();
          },
        );
      })
      .catch(error => {
        console.error(error);
        setError(error.message);
      });
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
    setCardStatus(CardStatus.WRITING);

    ToastAndroid.showWithGravity(
      'Start writing...',
      ToastAndroid.SHORT,
      ToastAndroid.TOP,
    );
  };

  // On exit screen
  useEffect(() => {
    const unsubscribe = navigation.addListener('blur', () => {
      // Do something when the screen blurs
      setCardStatus(CardStatus.IDLE);
    });

    return unsubscribe;
  }, [navigation]);

  // Add Listeners
  useEffect(() => {
    switch (cardStatus) {
      case CardStatus.READING:
        NativeModules.MyReactModule.setCardMode('read');

        const readEventListener = eventEmitter.addListener(
          'CardHasBeenRead',
          onReadCard,
        );

        return () => {
          return readEventListener.remove();
        };

      case CardStatus.WRITING:
        resetOutput();
        NativeModules.MyReactModule.setCardMode('createBoltcard');

        const writeEventListener = eventEmitter.addListener(
          'CreateBoltCard',
          onWriteCard,
        );

        return () => {
          return writeEventListener.remove();
        };
    }
  }, [cardStatus]);

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
          <Title>Seleccioná la skin</Title>
          <Text>asdas</Text>
        </Card.Content>
      </Card>

      <Card style={{marginBottom: 20, marginHorizontal: 10}}>
        <Card.Content>
          <Title>Check URLs and Keys</Title>
          <Text>Aca va algo</Text>
        </Card.Content>
        <Card.Actions style={{justifyContent: 'space-around'}}>
          {cardStatus === CardStatus.WRITING && (
            <Text>Apoya para escribir</Text>
          )}
        </Card.Actions>
      </Card>

      <Card style={{marginBottom: 20, marginHorizontal: 10}}>
        <Card.Content>
          <Title>Error</Title>
          <Text>error: {error}</Text>
          <Text>tagTypeError: {tagTypeError}</Text>
        </Card.Content>
      </Card>

      <Card style={{marginBottom: 20, marginHorizontal: 10}}>
        <Card.Content>
          <Title>Card Data</Title>
          <Text>{JSON.stringify(cardData)}</Text>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}
