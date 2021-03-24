import React, { Component } from "react";
import {
  Content,
  Button,
  Item,
  Label,
  Input,
  Icon,
  Form,
  Text
} from "native-base";

export default class Note extends Component {
  constructor(props) {
    super(props);
    this.state = {
      note: "",
      resault: null,
      items: []
    };
  }
  addNote = text => {
    const { note } = this.state;
    if (!note) return null;
    this.props.addNote(note);
  };

  render() {
    return (
      <Content>
        <Form>
          <Item floatingLabel>
            <Label style={{ margin: 9, textAlign: "center" }}>Note</Label>
            <Input
              //maxLength={3}
              //keyboardType="numeric"
              // placeholder={this.props.wino}
              value={this.state.note}
              onChangeText={note => this.setState({ note })}
              onSubmitEditing={() => this.addNote(this.state.note)}
              style={{ margin: 9, textAlign: "center" }}
            />
          </Item>
        </Form>
        <Button
          onPress={() => this.addNote(this.state.note)}
          block
          style={{ margin: 15, marginTop: 50 }}
        >
          <Text>Add</Text>
        </Button>
      </Content>
    );
  }
}
