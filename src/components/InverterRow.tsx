import { Link } from 'expo-router';
import { Pressable, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { InverterConfig } from '@/utils/configStore';

interface InverterRowProps {
  inverter: InverterConfig;
}

export function InverterRow({ inverter }: InverterRowProps) {
  return (
    <Link href={`/inverter/${inverter.id}`} asChild>
      <Pressable style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.serial}>{inverter.serialNumber}</Text>
          <Text style={styles.efficiency}>{Math.round(inverter.efficiency)}% efficient</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  content: {
    flex: 1,
    gap: 2,
  },
  serial: {
    fontSize: 17,
    fontWeight: '400',
    fontFamily: 'Menlo',
    color: '#000',
  },
  efficiency: {
    fontSize: 15,
    color: '#6366f1',
  },
});
