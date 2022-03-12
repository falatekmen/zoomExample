import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet, Text, TextInput } from 'react-native';


export function JoinScreen({ navigation }) {

  const [sessionName, setSessionName] = useState('');
  const [sessionPassword, setSessionPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [sessionIdleTimeoutMins, setSessionIdleTimeoutMins] = useState('40');
  const [roleType, setRoleType] = useState('');

  return (
    <View style={styles.container}>
      {/* session name */}
      <View style={styles.inputContainer}>
        <View style={styles.textWrapper}>
          <Text style={styles.text}>Session Name</Text>
        </View>
        <TextInput
          style={styles.input}
          placeholder={"Required"}
          value={sessionName}
          onChangeText={setSessionName}
          autoCapitalize="none"
        />
      </View>
      {/* display name */}
      <View style={styles.inputContainer}>
        <View style={styles.textWrapper}>
          <Text style={styles.text}>Display Name</Text>
        </View>
        <TextInput
          style={styles.input}
          placeholder={"Required"}
          value={displayName}
          onChangeText={setDisplayName}
        />
      </View>
      {/* password */}
      <View style={styles.inputContainer}>
        <View style={styles.textWrapper}>
          <Text style={styles.text}>Password</Text>
        </View>
        <TextInput
          style={styles.input}
          placeholder={"Optional"}
          value={sessionPassword}
          onChangeText={setSessionPassword}
          secureTextEntry
        />
      </View>
      {/* session idle timeout mins */}
      <View style={styles.inputContainer}>
        <View style={styles.textWrapper}>
          <Text style={styles.text}>Session Idle Time out (Mins)</Text>
        </View>
        <TextInput
          style={styles.input}
          placeholder={"Optional"}
          value={sessionIdleTimeoutMins}
          onChangeText={setSessionIdleTimeoutMins}
        />
      </View>
      {/* role type */}
      <View style={styles.inputContainer}>
        <View style={styles.textWrapper}>
          <Text style={styles.text}>Role Type</Text>
        </View>
        <TextInput
          style={styles.input}
          placeholder={"Required (1 for Host, 0 for attendee)"}
          value={roleType}
          onChangeText={setRoleType}
          keyboardType={"numeric"}
        />
      </View>
      <TouchableOpacity
        onPress={() =>
          navigation.navigate('Call', {
            sessionName,
            displayName,
            sessionPassword,
            roleType,
            sessionIdleTimeoutMins,
          })}
        style={styles.button}
      >
        <Text style={styles.buttonText}>Start</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    paddingTop: 50
  },
  inputContainer: {
    marginLeft: 10,
    paddingVertical: 5,
    alignItems: 'center',
    flexDirection: 'row',
    borderBottomColor: '#8b8b9b',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  textWrapper: {
    flex: 1,
  },
  text: {
    color: '#8b8b9b',
  },
  input: {
    flex: 2,
    height: 40,
  },
  button: {
    backgroundColor: '#0e71eb',
    alignItems: 'center',
    marginTop: 15,
    marginHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 5,
  },
  buttonText: {
    color: 'white',
  },
});
