import * as React from 'react';

import { ISignal, Signal } from '@phosphor/signaling';

import { VDomModel, VDomRenderer } from '@jupyterlab/apputils';

import classNames from 'classnames';

export interface IConnectionEditorModel {
  readonly connectionUrl: string;
  readonly connect: ISignal<this, string>;
  readonly connectionUrlChanged: ISignal<this, string>;
}

export class ConnectionEditorModel extends VDomModel
  implements IConnectionEditorModel {
  constructor(initialConnectionUrl: string) {
    super();
    this._connectionUrl = initialConnectionUrl;
  }

  tryConnect(connectionUrl: string): void {
    this._connect.emit(connectionUrl);
  }

  get connectionUrl(): string {
    return this._connectionUrl;
  }

  set connectionUrl(newValue: string) {
    this._connectionUrl = newValue;
    this._connectionUrlChanged.emit(newValue);
  }

  get connect(): ISignal<this, string> {
    return this._connect;
  }

  get connectionUrlChanged(): ISignal<this, string> {
    return this._connectionUrlChanged;
  }

  private _connectionUrl: string;
  private readonly _connectionUrlChanged = new Signal<this, string>(this);
  private readonly _connect = new Signal<this, string>(this);
}

export class ConnectionEditor extends VDomRenderer<ConnectionEditorModel> {
  static withModel(model: ConnectionEditorModel): ConnectionEditor {
    const editor = new ConnectionEditor();
    editor.model = model;
    return editor;
  }

  onActivateRequest() {
    this.node.querySelector('input').focus();
  }

  render() {
    if (!this.model) {
      return null;
    } else {
      const connectionUrl = this.model.connectionUrl;
      return (
        <div className="p-Sql-ConnectionInformation-container">
          <ConnectionInformationEdit
            initialConnectionUrl={connectionUrl}
            onConnectionUrlChanged={newConnectionUrl =>
              (this.model.connectionUrl = newConnectionUrl)
            }
            onFinishEdit={currentConnectionUrl =>
              this.model.tryConnect(currentConnectionUrl)
            }
          />
          <ConnectionInformationHelper />
        </div>
      );
    }
  }
}

class ConnectionInformationEdit extends React.Component<
  ConnectionInformationEdit.Props,
  ConnectionInformationEdit.State
> {
  constructor(props: ConnectionInformationEdit.Props) {
    super(props);
    this.state = {
      connectionUrl: props.initialConnectionUrl,
      focused: false
    };
  }

  private inputRef = React.createRef<HTMLInputElement>();

  onKeyDown(event: React.KeyboardEvent<HTMLInputElement>): void {
    if (event.key === 'Enter') {
      this.finish();
    } else if (event.keyCode === 27) {
      // ESC key
      this.cancel();
    }
  }

  onChange(event: React.ChangeEvent<HTMLInputElement>) {
    const newConnectionUrl = event.target.value;
    this.props.onConnectionUrlChanged(newConnectionUrl);
    this.setState({ connectionUrl: newConnectionUrl });
  }

  start() {
    this.setState({
      focused: true
    });
  }

  finish() {
    this.props.onFinishEdit(this.state.connectionUrl);
    this.setState({
      focused: false
    });
  }

  cancel() {
    const newConnectionUrl = this.props.initialConnectionUrl;
    this.props.onConnectionUrlChanged(newConnectionUrl);
    this.setState({ connectionUrl: newConnectionUrl });
  }

  onInputFocus() {
    this.start();
  }

  onInputBlur() {
    this.setState({
      focused: false
    });
  }

  componentDidMount() {
    this.inputRef.current!.focus();
  }

  render() {
    const { connectionUrl, focused } = this.state;
    const inputWrapperClass = classNames(
      'p-Sql-ConnectionInformation-input-wrapper',
      { 'p-mod-focused': focused }
    );
    return (
      <div className="p-Sql-ConnectionInformation-wrapper">
        <div className={inputWrapperClass}>
          <input
            className="p-Sql-ConnectionInformation-text p-Sql-ConnectionInformation-input"
            value={connectionUrl}
            ref={this.inputRef}
            autoFocus={true}
            onChange={event => this.onChange(event)}
            onKeyDown={event => this.onKeyDown(event)}
            onBlur={() => this.onInputBlur()}
            onFocus={() => this.onInputFocus()}
          />
        </div>
      </div>
    );
  }
}

namespace ConnectionInformationEdit {
  export interface Props {
    initialConnectionUrl: string;
    onFinishEdit: (newConnectionUrl: string) => void;
    onConnectionUrlChanged: (newConnectionString: string) => void;
  }

  export interface State {
    connectionUrl: string;
    focused: boolean;
  }
}

class ConnectionInformationHelper extends React.Component<{}> {
  render() {
    return (
      <details className="jp-RenderedHTMLCommon">
        <summary>Help</summary>
        <p>Fill in a simplified <strong>database</strong> URL and press <code>Enter</code> to connect to the database in your environment. <br/>
        The URL must be a following format:</p>
        <p >&lt;protocol&gt;://&lt;catalog&gt;/&lt;schema&gt;</p>
        <ul>
        <li>&lt;protocol&gt; - [required] protocol used to connect to the database (e.g. <strong>presto</strong>)</li>
        <li>&lt;catalog&gt; - [required] metadata catalog (e.g. <strong>hive</strong>)</li>
        <li>&lt;schema&gt; - [required] database or schema (e.g. <strong>hdp_sand</strong>)</li>
        </ul>
        <p >Sample simplified connection URLs:</p>
        <ul>
        <li>presto://hive/hdp_ware</li>
        <li>presto://hive/hdp_sand</li>
        </ul>
        <p><strong>Querying database tables</strong><br/>
        After connecting to the database, in order to query the database table click on the table name in the list or click on <em>Custom SQL query</em> and type in your SQL query.</p>
        <p>Note:</p>
        <ul>
        <li>submit your query by <code>Ctrl + Enter</code></li>
        <li><strong>no semicolons</strong> (<code>;</code>) are needed at the end of the query</li>
        <li><strong>only one SQL query</strong> per window is allowed</li>
        </ul>

      </details>
    );
  }
}
