/* eslint-disable no-alert */
import {useNavigation} from '@react-navigation/native';
import React, {useCallback, useEffect, useState} from 'react';
import {Dropdown} from 'react-native-element-dropdown';
import {
  ActivityIndicator,
  Button,
  ScrollView,
  StyleSheet,
  Text,
  ToastAndroid,
  Image,
} from 'react-native';
import {Card, Title} from 'react-native-paper';
import Config from 'react-native-config';

import skins from '../constants/skins';
import NfcManager, {NfcTech} from 'react-native-nfc-manager';
import WriteModal from '../components/WriteModal';
import {createInitializeCardEvent} from '../lib/utils';

import {getEventHash, getPublicKey, getSignature} from 'nostr-tools';

const CardStatus = {
  IDLE: 'idle',
  READING: 'reading',
  CREATING_CARD: 'creating_card',
  WRITING: 'writing',
};

const ADMIN_URL = Config.ADMIN_URL;
const CARD_MODULE_PUBLIC_KEY = Config.CARD_MODULE_PUBLIC_KEY;
const NOSTR_PRIVATE_KEY = Config.NOSTR_PRIVATE_KEY;

export default function CreateBulkBoltcardScreen(props) {
  const [cardData, setCardData] = useState();

  const [cardStatus, setCardStatus] = useState(CardStatus.IDLE);
  const [error, setError] = useState();

  const [openSkin, setOpenSkin] = useState(false);
  const [skin, setSkin] = useState();

  const navigation = useNavigation();

  const onReadCard = useCallback(
    event => {
      const _cardUID = event.id?.toLowerCase();
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

      try {
        requestCreateCard(_cardUID, skin);
      } catch (e) {
        alert(e.reason);
        setCardStatus(CardStatus.IDLE);
      }
    },
    [requestCreateCard, skin],
  );

  const requestCreateCard = useCallback(
    async (_cardUID, _skin) => {
      setCardStatus(CardStatus.CREATING_CARD);
      // Make request to create card

      const url = `${ADMIN_URL}/ntag424`;
      console.info('url', url);
      // create request
      ToastAndroid.showWithGravity(
        `Creating card : ${url}`,
        ToastAndroid.SHORT,
        ToastAndroid.TOP,
      );

      const event = createInitializeCardEvent(
        _cardUID,
        {
          uuid: _skin.value,
          name: _skin.label,
        },
        CARD_MODULE_PUBLIC_KEY,
      );

      event.pubkey = getPublicKey(NOSTR_PRIVATE_KEY);
      event.id = getEventHash(event);
      event.sig = getSignature(event, NOSTR_PRIVATE_KEY);

      console.info('skin', _skin);
      console.info('cardUID', _cardUID);
      fetch(url, {
        method: 'POST',
        body: JSON.stringify(event),
      })
        .then(response => response.json())
        .then(json => {
          console.info('json', JSON.stringify(json));
          const data = json.content;
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
          setCardStatus(CardStatus.WRITING);
          setCardData(data);
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
      setCardStatus(CardStatus.IDLE);
      alert(e);
      console.error(e);
    }
  }, [onReadCard]);

  // On exit screen
  useEffect(() => {
    const unsubscribe = navigation.addListener('blur', () => {
      // Do something when the screen blurs
      setCardStatus(CardStatus.IDLE);
      NfcManager.cancelTechnologyRequest();
    });

    return unsubscribe;
  }, [navigation]);

  // Add Listeners
  useEffect(() => {
    switch (cardStatus) {
      case CardStatus.READING:
        setCardData();
        startReading();
        break;

      default:
        setCardData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cardStatus]);

  // On mount
  useEffect(() => {
    // NfcManager.start();
    // console.info('getPublicKey');
    // console.info(getPublicKey);
    // const pubkey = getPublicKey(NOSTR_PRIVATE_KEY);
    // console.info('pubkey');
    // console.info(pubkey);
  }, []);

  return (
    <ScrollView style={{}}>
      {cardStatus === CardStatus.READING ? (
        <Text
          style={{
            margin: 20,
            fontWeight: 'bold',
            fontSize: 15,
            textAlign: 'center',
          }}>
          <ActivityIndicator />
          <Text>Hold NFC card to Reader</Text>
        </Text>
      ) : (
        <>
          {skin && cardStatus === CardStatus.IDLE && (
            <Card style={{marginHorizontal: 10}}>
              <Button
                onPress={() => setCardStatus(CardStatus.READING)}
                title="Start reading"
              />
            </Card>
          )}
        </>
      )}

      <Card
        style={{
          marginBottom: 20,
          marginTop: 10,
          marginHorizontal: 10,
          zIndex: 1000,
        }}>
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

          {skin && <Image style={styles.cardImage} source={skin.file} />}
        </Card.Content>
      </Card>

      {(cardStatus === CardStatus.READING || skin) && (
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
      <WriteModal
        visible={cardStatus === CardStatus.WRITING}
        onCancel={() => setCardStatus(CardStatus.IDLE)}
        onSuccess={() => setCardStatus(CardStatus.READING)}
        cardData={cardData}
      />
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
  text: {
    fontSize: 20,
    textAlign: 'center',
    borderColor: 'black',
  },
  cardImage: {
    width: '100%',
    height: 200,
    borderRadius: 15,
  },
});
