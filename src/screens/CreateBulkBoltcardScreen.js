/* eslint-disable no-alert */
import {useNavigation} from '@react-navigation/native';
import React, {useCallback, useEffect, useState} from 'react';
import {Dropdown} from 'react-native-element-dropdown';
import {
  ActivityIndicator,
  Button,
  NativeEventEmitter,
  NativeModules,
  ScrollView,
  StyleSheet,
  Text,
  ToastAndroid,
  View,
  Image,
} from 'react-native';
import {Card, Paragraph, Title} from 'react-native-paper';
import {generateKeys} from '../utils/card';
import Config from 'react-native-config';

import skins from '../constants/skins';
import NfcManager, {NfcTech} from 'react-native-nfc-manager';

const CardStatus = {
  IDLE: 'idle',
  READING: 'reading',
  CREATING_CARD: 'creating_card',
  WRITING: 'writing',
};

const ADMIN_URL = Config.ADMIN_URL;

const eventEmitter = new NativeEventEmitter();

export default function CreateBulkBoltcardScreen(props) {
  const [cardUID, setCardUID] = useState();
  const [cardData, setCardData] = useState();
  const [tagTypeError, setTagTypeError] = useState();

  const [cardStatus, setCardStatus] = useState(CardStatus.IDLE);
  const [error, setError] = useState();

  const [openSkin, setOpenSkin] = useState(false);
  const [skin, setSkin] = useState();

  const [items, setItems] = useState(skins);

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
        'The card is already setup',
        ToastAndroid.SHORT,
        ToastAndroid.TOP,
      );
      return;
    }

    requestCreateCard(_cardUID, skin);
  }, []);

  const onWriteCard = useCallback(event => {
    console.info('event: ');
    console.dir(event);
    if (!event) {
      alert('Event not found');
      return;
    }
    if (event.tagTypeError) {
      setTagTypeError(event.tagTypeError);
    }
    if (event.cardUID) {
      setCardUID(event.cardUID);
    }

    if (!event.ndefWritten || !event.writekeys) {
      console.error("We didn't get the ndefWritten or writekeys");
    }

    if (event.readNDEF) {
      //we have the latest read from the card fire it off to the server.
      const httpsLNURL = event.readNDEF.replace('lnurlw://', 'https://');
      fetch(httpsLNURL)
        .then(response => response.json())
        .then(json => {
          console.dir(json);
          alert(json);
          ToastAndroid.showWithGravity(
            'Card Written!',
            ToastAndroid.SHORT,
            ToastAndroid.TOP,
          );
          // setTestBolt('success');
        })
        .catch(error => {
          alert('Error: ' + error.message);
        });
    }

    setCardData();
    setCardStatus(CardStatus.READING);
  }, []);

  const resetOutput = () => {
    setTagTypeError(null);
    setCardUID(null);
    setCardData();
  };

  const requestCreateCard = useCallback(
    async (_cardUID, _skin) => {
      setCardStatus(CardStatus.CREATING_CARD);
      // Make request to create card

      const url = `${ADMIN_URL}`;
      // create request
      ToastAndroid.showWithGravity(
        `Creating card : ${url}`,
        ToastAndroid.SHORT,
        ToastAndroid.TOP,
      );

      console.info('skin', _skin);
      console.info('cardUID', _cardUID);
      fetch(url, {
        method: 'POST',
        body: JSON.stringify({
          skin,
          cardUID: _cardUID,
          keys: generateKeys(),
        }),
      })
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
              console.log('Change keys response', response);
              if (response === 'Success') {
                setCardStatus(CardStatus.WRITING);
              }
            },
          );
        })
        .catch(_error => {
          alert(_error.message);
          setCardStatus(CardStatus.IDLE);
          console.error(_error);
          setError(_error.message);
        });
    },
    [skin],
  );

  const startReading = async () => {
    console.info('START reading...');
    await NfcManager.requestTechnology(NfcTech.IsoDep);
    const tag = await NfcManager.getTag();

    console.info('tag:');
    console.dir(tag);
    onReadCard(tag);
  };

  const startWriting = () => {};

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
        // NativeModules.MyReactModule.setCardMode('read');

        // const readEventListener = eventEmitter.addListener(
        //   'CardHasBeenRead',
        //   onReadCard,
        // );

        // return () => {
        //   return readEventListener.remove();
        // };
        startReading();
        break;

      case CardStatus.WRITING:
        resetOutput();
        // startWriting();
        NativeModules.MyReactModule.setCardMode('createBoltcard');

        const writeEventListener = eventEmitter.addListener(
          'CreateBoltCard',
          onWriteCard,
        );

        return () => {
          return writeEventListener.remove();
        };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
          <ActivityIndicator />
          <Text>Hold NFC card to Reader</Text>

          <View>
            {cardStatus === CardStatus.READING ? (
              <Button
                onPress={() => {
                  onReadCard({cardUID: '1234567890'});
                }}
                title="read"
              />
            ) : (
              <Button onPress={() => alert('WRITE')} title="write" />
            )}
          </View>
        </Text>
      ) : (
        <>
          {skin && (
            <Card style={{marginBottom: 10, marginHorizontal: 10}}>
              <Button
                onPress={() => setCardStatus(CardStatus.READING)}
                title="Start reading"
              />
            </Card>
          )}
        </>
      )}

      <Card style={{marginBottom: 20, marginHorizontal: 10, zIndex: 1000}}>
        <Card.Content>
          {cardStatus === CardStatus.IDLE && (
            <>
              <Title>Card skin</Title>
              <Dropdown
                style={[styles.dropdown, openSkin && {borderColor: 'blue'}]}
                placeholderStyle={styles.placeholderStyle}
                selectedTextStyle={styles.selectedTextStyle}
                data={skins}
                search
                maxHeight={300}
                labelField="label"
                valueField="value"
                placeholder={!openSkin ? 'Select item' : '...'}
                searchPlaceholder="Search..."
                value={skin ? skin.value : null}
                onFocus={() => setOpenSkin(true)}
                onBlur={() => setOpenSkin(false)}
                onChange={item => {
                  setSkin(item);
                  setOpenSkin(false);
                }}
              />
            </>
          )}

          {skin && (
            <Image
              style={{
                width: '100%',
                height: 200,
                borderRadius: 15,
              }}
              // source={require()}
              source={skin.file}
            />
          )}
          {/* <Text>{skin}</Text> */}
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Title>Status ({cardStatus})</Title>
          <Paragraph style={{fontWeight: 'bold', fontSize: 15}}>
            Falta escanear 1 vez
          </Paragraph>
        </Card.Content>
      </Card>

      {(cardStatus !== CardStatus.IDLE || skin) && (
        <Card style={styles.card}>
          <Card.Content>
            <Button
              onPress={() => {
                setCardStatus(CardStatus.IDLE);
                setSkin();
              }}
              title="Cancelar"
            />
          </Card.Content>
        </Card>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 20,
    marginHorizontal: 10,
  },
  spaceAround: {
    justifyContent: 'space-around',
  },
  dropdown: {
    height: 50,
    borderColor: 'gray',
    borderWidth: 0.5,
    borderRadius: 8,
    paddingHorizontal: 8,
    marginBottom: 10,
  },
});
