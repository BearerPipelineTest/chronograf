import React, {PureComponent, ReactElement} from 'react'
import {connect, ResolveThunks} from 'react-redux'
import {withSource} from 'src/CheckSources'
import {
  loadUsersAsync,
  loadRolesAsync,
  loadPermissionsAsync,
  loadDBsAndRPsAsync,
} from 'src/admin/actions/influxdb'

import PageSpinner from 'src/shared/components/PageSpinner'
import {Page} from 'src/reusable_ui'
import {ErrorHandling} from 'src/shared/decorators/errors'

import {notify as notifyAction} from 'src/shared/actions/notifications'
import {Source, RemoteDataState, SourceAuthenticationMethod} from 'src/types'

const mapDispatchToProps = {
  loadUsers: loadUsersAsync,
  loadRoles: loadRolesAsync,
  loadPermissions: loadPermissionsAsync,
  loadDBsAndRPs: loadDBsAndRPsAsync,
  notify: notifyAction,
}

interface OwnProps {
  source: Source
  children: ReactElement<any>
}

type ReduxDispatchProps = ResolveThunks<typeof mapDispatchToProps>

type Props = OwnProps & ReduxDispatchProps
interface State {
  loading: RemoteDataState
  error?: any
  errorMessage?: string
}

@ErrorHandling
export class AdminInfluxDBScopedPage extends PureComponent<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      loading: RemoteDataState.NotStarted,
    }
  }
  public async componentDidMount() {
    await this.refresh()
  }

  private refresh = async () => {
    const {
      source,
      loadUsers,
      loadRoles,
      loadPermissions,
      loadDBsAndRPs,
    } = this.props
    if (!source.version || source.version.startsWith('2')) {
      // administration is not possible for v2 type
      return
    }

    this.setState({loading: RemoteDataState.Loading})

    let errorMessage: string
    try {
      errorMessage = 'Failed to load databases.'
      await loadDBsAndRPs(source.links.databases)
      if (source.authentication !== SourceAuthenticationMethod.LDAP) {
        errorMessage = 'Failed to load users.'
        await loadUsers(source.links.users)
        errorMessage = 'Failed to load permissions.'
        await loadPermissions(source.links.permissions)
        if (source.links.roles) {
          errorMessage = 'Failed to load roles.'
          await loadRoles(source.links.roles)
        }
      }
      this.setState({loading: RemoteDataState.Done})
    } catch (error) {
      console.error(error)
      this.setState({
        loading: RemoteDataState.Error,
        error,
        errorMessage: `Unable to administer InfluxDB. ${errorMessage}`,
      })
    }
  }

  public render() {
    return (
      <Page>
        <div className="deceo">
          <Page.Header fullWidth={true}>
            <Page.Header.Left>
              <Page.Title title="InfluxDB Admin" />
            </Page.Header.Left>
            <Page.Header.Right showSourceIndicator={true}>
              {this.state.loading !== RemoteDataState.Loading && (
                <span
                  className="icon refresh"
                  title="Refresh"
                  onClick={this.refresh}
                />
              )}
            </Page.Header.Right>
          </Page.Header>
          <div style={{height: 'calc(100% - 60px)'}}>{this.admin}</div>
        </div>
      </Page>
    )
  }

  private get admin(): JSX.Element {
    const {source, children} = this.props
    const {loading, error, errorMessage} = this.state
    if (loading === RemoteDataState.Loading) {
      return <PageSpinner />
    }

    if (loading === RemoteDataState.Error) {
      return (
        <div className="container-fluid">
          <div className="panel-body">
            <p className="unexpected-error">{errorMessage}</p>
            <p className="unexpected-error">{(error || '').toString()}</p>
          </div>
        </div>
      )
    }

    if (!source.version || source.version.startsWith('2')) {
      return (
        <div className="container-fluid">
          These functions are not available for the currently selected InfluxDB
          Connection.
        </div>
      )
    }
    return <div>{children}</div>
  }
}

export default withSource(
  connect(null, mapDispatchToProps)(AdminInfluxDBScopedPage)
)
