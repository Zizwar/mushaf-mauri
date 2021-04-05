import React from "react";

import {
  Button,
  Text,
  Card,
  CardItem,
  Left,
  View,
  Thumbnail,
  ListItem,
  Right,
  Body,
  Header,
  H3,
  Col,
} from "native-base";

import { isRTL } from "expo-localization";

import { Ionicons } from "@expo/vector-icons";

export const Icon = ({ name = "", size = 36, color = "#000", style = [] }) => (
  <Ionicons name={name} size={size} color={style.color || color} />
);

export const ScreenAya = ({
  onpress,
  aya,
  sura,
  text,
  page,
  fontSize = 14,
  color,
}) => (
  <Card>
    <CardItem button onPress={onpress}>
      <Col style={{ alignItems: "center", margin: 3 }}>
        <View style={{ alignSelf: "center" }}>
          <Text style={{ color, textAlign: "center" }}>
            {sura} {aya}
          </Text>
          <Text style={{ textAlign: "center", color: "#555", fontSize }}>
            {text}
          </Text>
        </View>
      </Col>
    </CardItem>
    {page && (
      <CardItem>
        <Left />
        <Right>
          <Text note style={{ color: "#555" }}>
            {page}
          </Text>
        </Right>
      </CardItem>
    )}
  </Card>
);
///////
export const ScreenBookmark = ({
  onpress,
  aya,
  sura,
  note,
  time = "",
  fontSize = 14,
}) => (
  <Card>
    <CardItem button onPress={onpress} style={{ height: 60 }}>
      <Left>
        <Icon color="#d4aa1e" name={"arrow-back"} />
      </Left>
      <Body>
        <H3 style={{ textAlign: "right", color: "#007aff" }}>{sura}</H3>
      </Body>
      <Right>
        <View
          style={{
            position: "absolute",
            width: 56,
            zIndex: 1,
          }}
        >
          <Text note style={{ color: "#fff", textAlign: "center" }}>
            {aya}
          </Text>
        </View>
        <Thumbnail
          square
          source={require("../../assets/number.png")}
          style={{ position: "absolute", zIndex: 0 }}
        />
      </Right>
    </CardItem>
    <CardItem button onPress={onpress}>
      <Col style={{ alignItems: "center", margin: 3 }}>
        <View style={{ alignSelf: "center" }}>
          <Text style={{ textAlign: "center", color: "#555", fontSize }}>
            {note}
          </Text>
        </View>
      </Col>
    </CardItem>

    <CardItem>
      <Left />
      <Right>
        <Text note style={{ color: "#555", textAlign: "right" }}>
          {time}
        </Text>
      </Right>
    </CardItem>
  </Card>
);

export const Itemino = ({
  onPress,
  icon,
  iconSize = 26,
  text = null,
  color = "#555",
  lang = "en",
  noborder = null,
  height,
  index,
  key,
  //isRtl = false
}) => {
  if (isRTL)
    return (
      <ListItem
        noBorder={noborder}
        style={{ height: height || 42 }}
        transparent
        onPress={onPress}
        key={key}
      >
        {lang === "ar" ? (
          <Left style={{ color, marginLeft: -15 }}>
            <Button transparent>
              {icon && (
                <Icon
                  style={{ color, paddingLeft: -5 }}
                  name={icon}
                  size={iconSize}
                />
              )}
              {index && <Text style={{ color }}>{index}</Text>}
            </Button>
            <Text style={{ color }}>{text}</Text>
          </Left>
        ) : null}

        {lang === "ar" ? null : (
          <>
            <Body>
              <Text style={{ color, marginRight: -5, textAlign: "right" }}>
                {text}
              </Text>
            </Body>
            <Right>
              {icon && (
                <Icon
                  style={{ color, paddingRight: 5 }}
                  name={icon}
                  size={iconSize}
                />
              )}
              {index && <Text style={{ color }}>{index}</Text>}
            </Right>
          </>
        )}
      </ListItem>
    );
  return (
    <ListItem
      noBorder={noborder}
      style={{ height: 42 }}
      transparent
      onPress={onPress}
    >
      {lang === "ar" ? null : (
        <Left style={{ color, marginLeft: 5 }}>
          <Button transparent>
            {icon && (
              <Icon
                style={{ color,  }}
                name={icon}
                size={iconSize}
              />
            )}
            {index && <Text style={{ color }}>{index}</Text>}
          </Button>
          <Text style={{ color,marginLeft: 7  }}>{text}</Text>
        </Left>
      )}

      {lang === "ar" ? (
        <>
          <Body>
            <Text style={{ color, marginRight: -5 }}>{text}</Text>
          </Body>
          <Right>
            {icon && (
              <Icon
                style={{ color, paddingRight: 5 }}
                name={icon}
                size={iconSize}
              />
            )}
            {index && <Text style={{ color }}>{index}</Text>}
          </Right>
        </>
      ) : null}
    </ListItem>
  );
};

export const Headerino = ({
  color,
  backgroundColor,
  icon = null,
  onPress,
  lang,
  text,
}) => {
  if (isRTL)
    return (
      <Header style={{ backgroundColor: color }}>
        <Left>
          <Button transparent onPress={onPress}>
            <Icon style={{ color: backgroundColor }} name={icon || "md-close-circle"} />
          </Button>
        </Left>
        {lang === "ar" ? (
          <Body>
            <Text style={{ color: backgroundColor, fontSize: 20 }}>{text}</Text>
          </Body>
        ) : (
          <Right>
            <Text style={{ color: backgroundColor, fontSize: 20 }}>{text}</Text>
          </Right>
        )}
      </Header>
    );
  return (
    <Header style={{ backgroundColor: color }}>
      <Left>
        <Button transparent onPress={onPress}>
          <Icon style={{ color: backgroundColor }} name={icon || "md-close-circle"} />
        </Button>
      </Left>
      {lang !== "ar" ? (
        <Body>
          <Text style={{ color: backgroundColor, fontSize: 20 }}>{text}</Text>
        </Body>
      ) : (
        <Right>
          <Text style={{ color: backgroundColor, fontSize: 20 }}>{text}</Text>
        </Right>
      )}
    </Header>
  );
};
