import React, { Component } from "react";
import {
  Container,
  Header,
  Title,
  Content,
  Button,
  Icon,
  List,
  ListItem,
  Text,
  Left,
  Right,
  Body
} from "native-base";
//import styles from "./styles";
import { allSuwar } from "../functions";
import { connect } from "react-redux";
import { setExactAya } from "../../reducer";
class SearchSura extends Component {
  componentWillMount() {
    // this.setState({vi: this.getData(NUM_DATA, 0)})
    // this.setState({vi: [{id: 1}, {id: 2}, {id: 3}, {id: 4}, {id: 5}, {id: 6}, {id: 7}, {id: 8}, {id: 9}, {id: 10}, {id: 11}]})
    this.allSuwar = allSuwar(this.props.lang);
  }
  goBack = arg => {
    if (this.props.togl) this.props.togl("close");
    else this.props.goBack();
    if (this.props.handleMenu) this.props.handleMenu('open');
  };
  onPressSura = id => {
    this.props.setExactAya({ aya: 1, sura: id });
    this.goBack(true);
  };

  render() {
    return (
      <Container>

        <Content>
          <List
            dataArray={this.allSuwar}
            renderRow={data => (
              <ListItem
                onPress={() => {
                  this.onPressSura(data.id);
                }}
              >
                <Body>
                  <Text>
                    {data.id}: {data.name} 
                  </Text>
                </Body>
              
              </ListItem>
            )}
          />
        </Content>
      </Container>
    );
  }
}
const mapStateToProps = ({ wino,lang }) => ({
  wino,lang
});

const mapDispatchToProps = {
  setExactAya
};
export default connect(
  mapStateToProps,
  mapDispatchToProps
)(SearchSura);
