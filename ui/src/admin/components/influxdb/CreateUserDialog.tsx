import React, {useCallback, useState} from 'react'
import {
  ComponentStatus,
  Form,
  Input,
  InputType,
  OverlayBody,
  OverlayContainer,
  OverlayHeading,
  OverlayTechnology,
} from 'src/reusable_ui'

const minLen = 3
export function validateUserName(name: string): boolean {
  return name?.length >= minLen
}
export const validatePassword = validateUserName

interface Props {
  create: (user: {name: string; password: string}) => void
  setVisible: (visible: boolean) => void
  visible: boolean
}
const CreateUserDialog = ({visible, setVisible, create}: Props) => {
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const cancel = useCallback(() => {
    setName('')
    setPassword('')
    setVisible(false)
  }, [])
  return (
    <OverlayTechnology visible={visible}>
      <OverlayContainer maxWidth={650}>
        <OverlayHeading title="Create User" onDismiss={cancel} />
        <OverlayBody>
          <Form>
            <Form.Element label="User Name">
              <Input
                value={name}
                onChange={e => setName(e.target.value)}
                autoFocus={true}
                status={
                  validateUserName(name)
                    ? ComponentStatus.Valid
                    : ComponentStatus.Default
                }
                testId="username--input"
              />
            </Form.Element>
            <Form.Element label="Password">
              <Input
                value={password}
                type={InputType.Password}
                status={
                  validatePassword(password)
                    ? ComponentStatus.Valid
                    : ComponentStatus.Default
                }
                onChange={e => setPassword(e.target.value)}
                testId="password--input"
              />
            </Form.Element>
            <Form.Footer>
              <div className="form-group text-center form-group-submit col-xs-12">
                <button className="btn btn-sm btn-default" onClick={cancel}>
                  Cancel
                </button>
                <button
                  className="btn btn-sm btn-success"
                  disabled={!(name && password)}
                  onClick={() => create({name, password})}
                >
                  Create
                </button>
              </div>
            </Form.Footer>
          </Form>
        </OverlayBody>
      </OverlayContainer>
    </OverlayTechnology>
  )
}

export default CreateUserDialog
