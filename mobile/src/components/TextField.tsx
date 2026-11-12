// A labelled text box for the sign-in forms. Extra props (keyboardType, secureTextEntry...) pass through.
import { StyleSheet, Text, TextInput, View, type TextInputProps } from "react-native";

import { colors, radius } from "@/theme";

interface Props extends TextInputProps {
  label: string;
}

export function TextField({ label, ...inputProps }: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        placeholderTextColor="#4f6b5f"
        autoCorrect={false}
        {...inputProps}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  label: { color: colors.cardText, fontSize: 14, fontWeight: "600" },
  input: {
    backgroundColor: colors.inset,
    color: colors.cardText,
    borderRadius: radius.field,
    borderWidth: 1,
    borderColor: "#659287",
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
});
