import {
  Controller,
  type Control,
  type FieldPath,
  type FieldValues,
  type RegisterOptions,
} from 'react-hook-form'
import { TextField } from '@mui/material'

type Props<TValues extends FieldValues> = {
  control: Control<TValues>
  name: FieldPath<TValues>
  label: string
  placeholder?: string
  helperText?: string
  maxLength: number
  rules: RegisterOptions<TValues, FieldPath<TValues>>
}

export default function ValidatedTextField<TValues extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  helperText,
  maxLength,
  rules,
}: Props<TValues>) {
  return (
    <Controller
      control={control}
      name={name}
      rules={rules}
      render={({ field: { ref, ...field }, fieldState }) => (
        <TextField
          {...field}
          inputRef={ref}
          fullWidth
          label={label}
          placeholder={placeholder}
          error={Boolean(fieldState.error)}
          helperText={fieldState.error?.message ?? helperText}
          slotProps={{ htmlInput: { maxLength } }}
        />
      )}
    />
  )
}
