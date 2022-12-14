import React, { useEffect, useState } from 'react'

import capitalizeFirstLetter from '@xrengine/common/src/utils/capitalizeFirstLetter'

import { useAutocomplete } from '@mui/base/AutocompleteUnstyled'
import Cross from '@mui/icons-material/Cancel'
import FormControl from '@mui/material/FormControl'
import FormHelperText from '@mui/material/FormHelperText'
import IconButton from '@mui/material/IconButton'

import { InputMenuItem } from '../InputSelect'
import styles from './index.module.scss'

interface Props {
  data: InputMenuItem[]
  label: string
  value?: string
  disabled?: boolean
  onChange?: (value: any) => void
  freeSolo?: boolean
  error?: string
}

const AutoComplete = ({ data, label, disabled, error, onChange, value = '', freeSolo = false }: Props) => {
  const [localValue, setLocalValue] = useState('')

  useEffect(() => {
    setLocalValue(value)
  }, [value])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e?.target) setLocalValue(e.target.value)
  }

  const handleClear = () => {
    setLocalValue('')
    if (onChange) onChange({ target: { value: '' } })
  }

  const { getRootProps, getInputProps, getListboxProps, getOptionProps, groupedOptions, setAnchorEl } = useAutocomplete(
    {
      id: 'autocomplete',
      freeSolo,
      value: localValue,
      inputValue: localValue,
      options: data,
      onInputChange: handleInputChange,
      getOptionLabel: (option) => option.label || '',
      onChange: (event: React.ChangeEvent<{}>, value: any, reason: string) => {
        if (value?.value != null) {
          setLocalValue(value.value)
          if (onChange) onChange({ target: { value: value.value } })
        }
      },
      isOptionEqualToValue: (option, value) => option.value === value.value
    }
  )

  return (
    <React.Fragment>
      <div className={styles.root}>
        <div {...getRootProps()}>
          <div
            ref={setAnchorEl}
            className={`.MuiAutocomplete-endAdornment .MuiAutocomplete-clearIndicator ${styles.inputWrapper}`}
          >
            <fieldset
              aria-hidden="true"
              className={`MuiOutlinedInput-notchedOutline-SCvfC knJUav MuiOutlinedInput-notchedOutline ${
                disabled ? 'disabled' : ''
              }`}
            >
              <legend>
                <span>{capitalizeFirstLetter(label)}</span>
              </legend>
            </fieldset>
            <input
              disabled={disabled}
              {...getInputProps()}
              onBlur={(event: any) => {
                getInputProps().onBlur?.(event)
                if (event?.target?.value?.length > 0 && onChange) onChange(event)
                if (event?.target?.value?.length === 0) handleClear()
              }}
            />
            <IconButton className={`.MuiAutocomplete-endAdornment ${styles.clearButton}`} onClick={() => handleClear()}>
              <Cross />
            </IconButton>
          </div>
        </div>
        {groupedOptions.length > 0 && (
          <ul className={styles.listbox} {...getListboxProps()}>
            {groupedOptions.map((option, index) => (
              <li {...getOptionProps({ option, index })}>
                <span>{option.label}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {error && (
        <FormControl error>
          <FormHelperText>{error}</FormHelperText>
        </FormControl>
      )}
    </React.Fragment>
  )
}

export default AutoComplete
