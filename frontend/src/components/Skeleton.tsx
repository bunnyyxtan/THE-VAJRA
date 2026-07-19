import React, { useEffect, useRef } from "react";
import { Animated, DimensionValue, StyleProp, ViewStyle } from "react-native";

import { useMotionPref } from "@/src/state/vajra";
import { C, R } from "@/src/theme";

interface Props {
  w?: DimensionValue;
  h?: number;
  r?: number;
  style?: StyleProp<ViewStyle>;
}

export default function Skeleton({ w = "100%", h = 16, r = R.sm, style }: Props) {
  const reduceMotion = useMotionPref();
  const anim = useRef(new Animated.Value(0.55)).current;

  useEffect(() => {
    if (reduceMotion) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.55, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [anim, reduceMotion]);

  return (
    <Animated.View
      style={[
        {
          width: w,
          height: h,
          borderRadius: r,
          backgroundColor: C.surface3,
          opacity: reduceMotion ? 0.7 : anim,
        },
        style,
      ]}
    />
  );
}
